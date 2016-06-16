#!/usr/bin/env python3

from argparse import ArgumentParser
from tiny_api import Api
from tinydb import TinyDB, Query, where
from collections import OrderedDict
import re


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

    """
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
    print('Pending:', sum(x['status'] in ['running'] for x in store.getJobs()))

    with open(path + '/pending.txt', 'w') as f:
      f.writelines('\n'.join(x['item'] for x in store.getJobs()))

    del new_items
    del db_items
    del db_jobs

    @route('/status')
    def status(request):
        return response({'status': 'ok'})

    @route('/jobs')
    def query_jobs(request):

        # jo = store.getJobs(Job.status == 'new')

        batch = jo[:1000]
        if batch:
            for job in batch:
                store.updateJobs({'status': 'running'}, batch)

        print()
        print('New batch:', [x['item'] for x in batch])
        print('Job queue:', len(jo))
        print()

        return response(batch)
    """

    @route('/items', 'POST')
    def add_item(request):
        item = request.content
        if item:
            store.addItem(item)
            print('Removing job:', item['name'])
            store.removeJob(where('item') == item['name'])
        return response()

    @route('/items', 'GET')
    def query_items(request):
        print(request.query_params)
        return response(store.query(request.query_params))

    api.run(**kwargs)


class Store:

    def __init__(self, path):
        self.db = TinyDB(path + '/db.json')
        self.jobs = self.db.table('jobs')
        self.items = self.db.table('items')
        self._cache = None

    # ===== items

    def addItem(self, item):
        name = item['name']
        if name:
            existing = self.findItem(where('name') == name)
            self._cache = None
            if not existing:
                print('New item:', name)
                return self.items.insert(item)
            else:
                print('Updating item:', name)
                self.items.update(item, eids=[existing.eid])
                return existing.eid

    def findItem(self, query):
        return self._single(self.items.search(query))

    def getItems(self, query=None):
        return self.items.all() if not query else self.items.search(query)

    def query(self, query_params):

        if not self._cache:
            self._cache = self.getItems()

        fields = query_params.get('fields', None)
        if fields:
            fields = fields[0].split(',')
            del query_params['fields']

        select = self._select(fields)

        predicates = [self._predicate(k,v[0]) for k,v in query_params.items()]
        result = []

        for item in self._cache:

            should_select = True

            for field, p in predicates:
                if field in item:
                    value = item[field]
                    if type(value) is list:
                        if not any(p(v) for v in value):
                            should_select = False
                            break
                    elif not p(value):
                        should_select = False
                        break

            if should_select:
                result.append(select(item))

        count = len(result)
        result = result[:100]

        r = OrderedDict()
        r['_list'] = result
        r['_pagination'] = { 'total': count }
        return r

    # ===== jobs

    def addJob(self, job):
        return self.jobs.insert(job)

    def addJobs(self, jobs):
        return self.jobs.insert_multiple(jobs)

    def findJob(self, query):
        return self._single(self.jobs.search(query))

    def getJobs(self, query=None):
        return self.jobs.all() if not query else self.jobs.search(query)

    def updateJobs(self, values, jobs):
        self.jobs.update(values, eids=[x.eid for x in jobs])

    def removeJob(self, query):
        self.jobs.remove(query)

    # ===== private

    def _single(self, xs):
        return next(iter(xs), None)

    def _predicate(self, field, test_value):
        return field, lambda x: re.match(test_value.replace('*', '.*'), x, re.IGNORECASE)

    def _select(self, fields):

        if not fields:
            return lambda x: x

        def select_fields(x):
            result = dict()
            for f in fields:
                try:
                    result[f] = x[f]
                except:
                    pass
            return result

        return select_fields


if __name__ == '__main__':
    main()
