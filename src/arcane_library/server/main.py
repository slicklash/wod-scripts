#!/usr/bin/env python3

from argparse import ArgumentParser
from tiny_api import Api
from tinydb import TinyDB, Query, where


api = Api()
route = api.route
response = api.response


def main():

    arg_parser = ArgumentParser()
    arg_parser.add_argument('-b', '--bind', help='bind address', default='')
    arg_parser.add_argument('-p', '--port', help='port number', type=int, default=8081)
    arg_parser.add_argument('-d', '--dir', help='store dir')

    kwargs = vars(arg_parser.parse_args())

    path = kwargs.get('dir')

    store = Store(path)
    Job = Query()
    Item = Query()

    # with open(path + '/items.txt', 'r') as f:
    #     lines = (x for x in f.read().split('\n') if x)
    #
    # new_items = []
    # for line in lines:
    #     existing_item = store.findItem(Item.name == line)
    #     existing_job = store.findJob((Job.item == line) & (Job.status != 'done'))
    #     if existing_item is None and existing_job is None:
    #         new_items.append({'type': 'parse', 'status': 'new', 'item': line})
    #
    # if new_items:
    #     store.addJobs(new_items)

    @route('/status')
    def status(request):
        return response({'status': 'ok'})

    @route('/jobs')
    def query_jobs(request):
        return response(store.getJobs())

    @route('/items', 'POST')
    def add_item(request):
        item = request.content
        store.addItem(item)
        store.removeJob(where('item') == item['name'])
        return response()

    api.run(**kwargs)


class Store:

    def __init__(self, path):
        self.db = TinyDB(path + '/db.json')
        self.jobs = self.db.table('jobs')
        self.items = self.db.table('items')

    # ===== items

    def addItem(self, item):
        name = item['name']
        if name:
            existing = self.findItem(where('name') == name)
            if not existing:
                return self.items.insert(item)
            else:
                self.items.update(item, eids=[existing.eid])
                return existing.eid

    def findItem(self, query):
        return self.single(self.items.search(query))

    # ===== jobs

    def addJob(self, job):
        return self.jobs.insert(job)

    def addJobs(self, jobs):
        return self.jobs.insert_multiple(jobs)

    def findJob(self, query):
        return self.single(self.jobs.search(query))

    def getJobs(self):
        return self.jobs.all()

    def removeJob(self, query):
        self.jobs.remove(query)

    # =====

    def single(self, xs):
        return next(iter(xs), None)


if __name__ == '__main__':
    main()
