#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import time
import requests
import json

def main(argv):
    while (True):
        try:
            response = requests.get("http://localhost:8001/api/v1/namespaces/default/pods?labelSelector=visualize%3Dtrue")
            json_value = json.loads(response.text)
            print json_value['items'][0]['status']['containerStatuses'][0]['ready']
            time.sleep(1)
        except KeyboardInterrupt:
            print "Caught KeyboardInterrupt, terminating process"
            sys.exit(-1)
    
if __name__ == '__main__':
   exit(main(sys.argv))
