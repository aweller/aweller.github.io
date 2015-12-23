import sys
from yaml import load, dump
from yaml import Loader, Dumper
import json
from pprint import pprint as pp

text = open(sys.argv[1]).read()
data = load(text, Loader=Loader)

def process_inner_dict(item):
    print item.keys()[0]
    return {'name':item.keys()[0], 'size':item.values()[0]}

def clean(input):
    if type(input[0]) == list:
        return input[0]
    else:
        return input

def process_any_dict(item):
    # print
    # print 'Processing', type(item), item

    if type(item.values()[0]) == int: # innermost
        # print 'Found inner dict:', item
        return process_inner_dict(item)
    
    else: # another level
        key = item.keys()[0]
        values = item.values()
        return {'name': key, 'children': clean([process_all(x) for x in values])}

def process_all(item):
    if type(item) == list:
        return clean([process_any_dict(x) for x in item])
        # if type(result[0]) == list:
        #     result = result[0]
        # return result  
    elif type(item) == dict:
        return process_any_dict(item)

processed_data = {'name':'flare', 'children': process_all(data)}    
# pp(processed_data)

with open(sys.argv[1].replace('yaml', 'json'), 'w') as out:
    json.dump(processed_data, out)