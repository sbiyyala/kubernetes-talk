#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import time
import requests
import json
from subprocess import call

'''
Get a list of pods based on filter/map criteria
'''
def get_pod_list(url, filter_lambda = lambda x: x, map_lambda = lambda x: x):
    response = requests.get(url=url)
    data = json.loads(response.text)
    pod_name_list = filter(filter_lambda, map(map_lambda, data['items']))

    return [str(x) for x in pod_name_list]

'''
Call kill containers script for relevant pod
'''
def kill_containers_in_pod_list(pod_list):
    for pod in pod_list:
        call(["./kill_containers_in_pods.sh", pod])

def main(argv):
    filter_lambda = lambda x: 'helloworld-deployment' in x
    map_lambda = lambda x: x['metadata']['name']
    pod_list = get_pod_list("http://localhost:8001/api/v1/pods", filter_lambda, map_lambda)
    print "Killing containers in %s pod instances"%(len(pod_list))
    kill_containers_in_pod_list(pod_list)
    
if __name__ == '__main__':
    exit(main(sys.argv))
