#!/usr/bin/env python3

from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs
from urllib.error import HTTPError
from json import dumps, loads
from collections import OrderedDict
import re


class Server(ThreadingMixIn, HTTPServer):

    def __init__(self, server_address, RequestHandlerClass, api):
        HTTPServer.__init__(self, server_address, RequestHandlerClass)
        self.api = api


class RequestHandler(BaseHTTPRequestHandler):

    def __init__(self, *args):
        for x in ['OPTIONS', 'GET', 'POST', 'PUT', 'DELETE']:
            self.__dict__['do_' + x] = self._handle_request
        super().__init__(*args)

    def _handle_request(self):
        self.server.api.process_request(self)


class RequestMessage:

    def __init__(self, headers, path, method, query_params):
        self.headers = headers
        self.path = path
        self.method = method
        self.query_params = query_params
        self.content = None


class Api:

    def __init__(self):
        self.resources = {}
        self.routes = []
        self.content_parsers = {'application/json': lambda content: loads(content.decode(encoding='utf-8'), object_pairs_hook=OrderedDict)}
        self.content_formatters = {'application/json': lambda code, content, headers: bytes(dumps(content), 'utf-8')}

    # ===== public

    def register(self, *resources):
        for x in resources:
            self.resources[x.__class__.__name__] = x

    def run(self, **kwargs):
        bind, port = kwargs.get('bind', ''), kwargs.get('port', 8081)
        print('Starting server at {}:{}'.format(bind or '0.0.0.0', port))
        Server((bind, port), RequestHandler, self).serve_forever()

    def process_request(self, handler):
        try:
            x = urlparse(handler.path)
            request = RequestMessage(handler.headers.__dict__, x.path, handler.command, parse_qs(x.query))
            route = self._get_route(request)
            request.content = self._read_content(handler, request)
            self._dispatch_request(handler, route, request)
        except HTTPError as e:
            return self._send_response(handler, e.code)

    def response(self, content=None, status_code=200, headers=None):
        return (status_code, content, headers or {})

    # ===== decorators

    def route(self, template, methods=None):
        def wrap(func):
            resource_name = func.__qualname__.split('.')[0]
            self.routes.append((self._route_pattern(template), resource_name, func, methods or 'GET'))
            return func
        return wrap

    def parse(self, content_type):
        def decorator(func):
            self.content_parsers[content_type] = func
            return func
        return decorator

    def format(self, content_type):
        def decorator(func):
            self.content_formatters[content_type] = func
            return func
        return decorator

    # ===== private

    def _dispatch_request(self, handler, route, request):
        resource_name, func, kwargs = route
        status_code, content, headers = func(self.resources[resource_name], request, **kwargs)
        self._send_response(handler, status_code, request.path, content, headers)

    def _send_response(self, handler, status_code, path=None, content=None, headers=None):
        _headers = {'content-type': 'application/json'}
        _headers.update(headers or {})
        try:
            content_type = _headers['content-type']
            formatter = self.content_formatters[content_type]
        except KeyError:
            raise HTTPError(path, 415, 'Unsupported Media Type', _headers, None)
        content = formatter(status_code, content, _headers) if content else None
        handler.send_response(status_code)
        for k,v in _headers.items():
            k = '-'.join([x.title() for x in k.split(' ')])
            handler.send_header(k, v)
        handler.end_headers()
        if content:
            handler.wfile.write(content)

    def _read_content(self, handler, request):
        # print('received',handler.headers.items())
        try:
            length = int(handler.headers['content-length'])
            content = handler.rfile.read(length)
            parser = self.content_parsers[handler.headers['content-type']]
            return parser(content) if content else None
        except TypeError:
            return None
        except KeyError:
            raise HTTPError(request.path, 415, 'Unsupported Media Type', request.headers, None)

    @staticmethod
    def _route_pattern(route):
        return re.compile('^{}$'.format(re.sub(r'(<\w+>)', r'(?P\1.+)', route)))

    def _get_route(self, request):
        not_allowed = False
        for pattern, resource, func, supported_methods in self.routes:
            m = pattern.match(request.path)
            if m:
                if request.method not in supported_methods:
                    not_allowed = True
                else:
                    return resource, func, m.groupdict()
        if not_allowed:
            raise HTTPError(request.path, 405, 'Method Not Allowed', request.headers, None)
        raise HTTPError(request.path, 404, 'Not Found', request.headers, None)
