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

    print('Reading items...')
    with open(path + '/items.txt', 'r') as f:
        lines = [x for x in f.read().split('\n') if x]

    total_count = len(lines)
    print('Total items:', total_count)

    new_items = []
    db_items = set(x['name'] for x in store.getItems())
    db_jobs = set(x['item'] for x in store.getJobs() if x['status'] in ['new', 'running'])

    print('Stored items:', len(db_items))

    for line in lines:
        if (line not in db_items) and (line not in db_jobs):
            new_items.append({'type': 'parse', 'status': 'new', 'item': line})

    if new_items:
        print('New items:', len(new_items))
        store.addJobs(new_items)

    print('Job queue:', len(new_items) + len(db_jobs))

    del new_items
    del db_items
    del db_jobs

    @route('/status')
    def status(request):
        return response({'status': 'ok'})

    @route('/jobs')
    def query_jobs(request):

        jo = store.getJobs()

        batch = jo[:100]
        if batch:
            for job in batch:
                job['status'] = 'running'
            store.updateJobs(batch)

        print()
        print('New batch:', [x['item'] for x in batch])
        print('Job queue:', len(jo))
        print()

        return response(batch)

    @route('/items', 'POST')
    def add_item(request):
        item = request.content
        if item:
            store.addItem(item)
            print('Removing job:', item['name'])
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
                print('New item:', name)
                return self.items.insert(item)
            else:
                print('Updating item:', name)
                self.items.update(item, eids=[existing.eid])
                return existing.eid

    def findItem(self, query):
        return self.single(self.items.search(query))

    def getItems(self, query=None):
        return self.items.all() if not query else self.items.search(query)

    # ===== jobs

    def addJob(self, job):
        return self.jobs.insert(job)

    def addJobs(self, jobs):
        return self.jobs.insert_multiple(jobs)

    def findJob(self, query):
        return self.single(self.jobs.search(query))

    def getJobs(self, query=None):
        return self.jobs.all() if not query else self.jobs.search(query)

    def updateJobs(self, jobs):
        for job in jobs:
            self.jobs.update(job, eids=[job.eid])

    def removeJob(self, query):
        self.jobs.remove(query)

    # =====

    def single(self, xs):
        return next(iter(xs), None)


if __name__ == '__main__':
    main()
