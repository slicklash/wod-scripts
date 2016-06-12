#!/usr/bin/env python3

from argparse import ArgumentParser
from tiny_api import Api

api = Api()
route = api.route
response = api.response


@route('/status')
def status(request):
    status = {'status': 'ok'}
    return response(status)


@route('/jobs')
def query_jobs(request):
    print('got request', request)
    jobs = []
    return response(jobs)


def main():
    arg_parser = ArgumentParser()
    arg_parser.add_argument('-b', '--bind', help='bind address', default='')
    arg_parser.add_argument('-p', '--port', help='port number', type=int, default=8081)
    kwargs = vars(arg_parser.parse_args())
    api.run(**kwargs)

if __name__ == '__main__':
    main()
