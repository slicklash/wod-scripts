#!/usr/bin/env python3

from argparse import ArgumentParser
from toyapi import Api
from tinydb import TinyDB, where
from collections import OrderedDict
from itertools import chain
from operator import lt, gt, eq
import os
import re
import sys


file_dir = os.path.dirname(os.path.realpath(__file__))
path_join = lambda *args: os.path.realpath(os.path.join(*args))

api = Api()
route = api.route
response = api.response
format = api.format


def main():

    arg_parser = ArgumentParser()
    arg_parser.add_argument('-b', '--bind', help='bind address', default='')
    arg_parser.add_argument('-p', '--port', help='port number', type=int, default=8081)
    arg_parser.add_argument('-d', '--dir', help='store dir')

    kwargs = vars(arg_parser.parse_args())

    if len(sys.argv) < 2:
        arg_parser.print_usage()
        sys.exit(1)

    path = kwargs.get('dir')

    store = Store(path)

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

    """

    api.register(ItemsResource(store), JobsResource(store), StaticResource())
    api.run(**kwargs)

class StaticResource:

    @route('/', 'GET')
    def index(self, request):
        return self.static(request, 'index.html')

    @route('/static/<item>', 'GET')
    def static(self, request, item):

        if item == 'app.js':
            item = '../../../../release/arcane_library.user.js'
        elif item == 'aagmfunctions.js':
            item =  '../../../../lib/' + item

        path = path_join(file_dir, '../static/' + item)
        if not os.path.exists(path):
            return (404)

        ct = 'text/html'

        if item.endswith('.js'):
            ct = 'text/javascript'
        elif item.endswith('.css'):
            ct = 'text/css'

        with open(path, 'r') as f:
            return (200, f.read(), {
                'content-type': ct,
                'Access-Control-Allow-Origin': '*'
            })

@format('text/html')
@format('text/css')
@format('text/javascript')
def format_html(code, content, headers):
    return bytes(content, 'utf-8')

class ItemsResource:

    def __init__(self, store):
        self.store = store

    @route('/items', 'GET')
    def query_items(self, request):
        print(request.query_params)
        return response(self.store.query(request.query_params), 200, {
            'Access-Control-Allow-Origin': '*'
        })

    @route('/items', 'POST')
    def add_item(self, request):
        item = request.content
        if item:
            self.store.addItem(item)
            print('Removing job:', item['name'])
            self.store.removeJob(where('item') == item['name'])
        return response()

class JobsResource:

    def __init__(self, store):
        self.store = store

    @route('/jobs')
    def query_jobs(self, request):

        jobs = self.store.getJobs(where('status') == 'new')
        batch = jobs[:1000]

        for job in batch:
            self.store.updateJobs({'status': 'running'}, batch)

        print()
        print('New batch:', [x['item'] for x in batch])
        print('Job queue:', len(jobs))
        print()

        return response(batch)


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

        if self._cache is None:
            self._cache = self.getItems()

        special_keys = ['fields', 'page', 'pageSize', 'orderBy']
        predicates = []
        filter_by = []

        for k, v in query_params.items():
            if k in special_keys:
                if k in ['fields', 'orderBy']:
                    query_params[k] = v[0].split(',')
            elif k == 'level':
                predicates.append((k, v[0]))
            else:
                k = k.replace('races', 'races.include').replace('heroClasses', 'heroClasses.include')
                filter_by.append(k)
                predicates.append(self._predicate(k, v[0]))

        select = self._select(query_params.get('fields', None))

        items = []

        def matches_constraint(con, p):
            if con == 'any':
                return True
            if 'exclude' in con and any(p(x) for x in con['exclude']):
                return False
            if 'include' in con:
                return any(p(x) for x in con['include'])
            return True

        def matches_level(requirements, test_value):
            item_lvl = next((x for x in requirements if 'level is' in x), None)
            if item_lvl:
                op = test_value[0]
                a = int(item_lvl.split()[-1])
                b = int(test_value[1:]) if op in '<>' else int(test_value)
                op = lt if op == '<' else gt if op == '>' else eq
                print(op, a, b)
                return op(a, b)
            return True

        for item in self._cache:

            should_select = True
            searchable = self._make_searchable(filter_by, item)

            for field, p in predicates:

                if field == 'level':
                    if 'requirements' not in item or matches_level(item['requirements'], p):
                        continue
                    else:
                        should_select = False
                        break

                if field == 'heroClasses.include':
                    if 'heroClasses' not in item or matches_constraint(item['heroClasses'], p):
                        continue
                    else:
                        should_select = False
                        break

                if field == 'races.include':
                    if 'races' not in item or matches_constraint(item['races'], p):
                        continue
                    else:
                        should_select = False
                        break

                if field not in searchable:
                    should_select = False
                    break

                value = searchable[field]
                if type(value) is list:
                    if not any(p(v) for v in value):
                        should_select = False
                        break
                elif p(value):
                    should_select = False
                    break
                if not should_select:
                    break

            if should_select:
                print(item['name'])
                items.append(select(item))

        return self._collection_response(query_params, items)

    def _collection_response(self, query_params, items):

        items = sorted(items, key=lambda x: x['name'].lower())
        page = int(query_params.get('page', [1])[0])
        pageSize = int(query_params.get('pageSize', [50])[0])
        count = len(items)
        items = items[(page - 1) * pageSize:page * pageSize]
        q, r = divmod(count, pageSize)
        pages = q + (1 if r else 0)

        r = OrderedDict()
        r['_list'] = items
        r['_pagination'] = {'total': count, 'pageSize': pageSize, 'page': page, 'pages': pages}
        return r

    def _make_searchable(self, filter_by, item):

        result = {}

        for field in filter_by:

            path = field.split('.')
            key = path.pop(0)

            if key not in item:
                continue

            values = item[key]
            if type(values) is not list:
                values = [values]

            while values and path:
                key = path.pop(0)
                values = [x[key] for x in values if key in x]
                if values and type(values[0]) is list:
                    values = list(chain(*values))

            if values:
                result[field] = values

        return result

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
        return field, lambda value: self._is_match(test_value, value)

    def _is_match(self, test_value, value):
        return re.match('^' + test_value.replace('+', '\+').replace('*', '.*') + '$', value, re.IGNORECASE)

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
