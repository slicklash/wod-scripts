#!/usr/bin/env python3

from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
from json import dumps, loads
from collections import OrderedDict
import re


class Server(HTTPServer):

    def __init__(self, server_address, RequestHandlerClass, api):
        HTTPServer.__init__(self, server_address, RequestHandlerClass)
        self.api = api


class RequestHandler(BaseHTTPRequestHandler):

    def __init__(self, *args):
        for x in ['GET', 'POST', 'PUT', 'DELETE']:
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
        self.routes = []
        self.content_parsers = {'application/json': lambda content: loads(content.decode(encoding='utf-8'), object_pairs_hook=OrderedDict)}
        self.content_formatters = {'application/json': lambda code, content, headers: bytes(dumps(content), 'utf-8')}

    def run(self, **kwargs):
        bind, port = kwargs.get('bind', ''), kwargs.get('port', 8081)
        print('Starting server at {}:{}'.format(bind or '0.0.0.0', port))
        Server((bind, port), RequestHandler, self).serve_forever()

    def process_request(self, handler):
        x = urlparse(handler.path)
        request = RequestMessage(handler.headers.__dict__, x.path, handler.command, parse_qs(x.query))
        try:
            route = self._get_route(request)
        except KeyError:
            return self._send_response(handler, 405)
        if route is None:
            return self._send_response(handler, 404)
        try:
            request.content = self._read_content(handler)
        except KeyError:
            return self._send_response(handler, 415)
        self._dispatch_request(handler, route, request)

    def route(self, template, methods=None):
        def decorator(func):
            self.routes.append((self.route_pattern(template), func, methods or 'GET'))
            return func
        return decorator

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

    def response(self, content=None, status_code=200, headers=None):
        return (status_code, content, headers or {})

    def _dispatch_request(self, handler, route, request):
        func, kwargs = route
        status_code, content, headers = func(request, **kwargs)
        self._send_response(handler, status_code, content, headers)

    def _send_response(self, handler, status_code, content=None, headers=None):
        _headers = {'content-type': 'application/json'}
        _headers.update(headers or {})
        try:
            formatter = self.content_formatters[_headers['content-type']]
            content = formatter(status_code, content, _headers) if content else None
        except KeyError:
            status_code = 415
            content = None
        handler.send_response(status_code)
        handler.send_header('Content-Type', _headers.get('content-type'))
        handler.end_headers()
        if content:
            handler.wfile.write(content)

    def _read_content(self, handler):
        try:
            length = int(handler.headers['content-length'])
            content = handler.rfile.read(length)
        except TypeError:
            return None
        parser = self.content_parsers[handler.headers['content-type']]
        return parser(content)

    @staticmethod
    def route_pattern(route):
        return re.compile('^{}$'.format(re.sub(r'(<\w+>)', r'(?P\1.+)', route)))

    def _get_route(self, request):
        not_allowed = False
        for pattern, func, methods in self.routes:
            m = pattern.match(request.path)
            if m:
                if request.method not in methods:
                    not_allowed = True
                else:
                    return func, m.groupdict()
        if not_allowed:
            raise KeyError('Method not allowed')
        return None
