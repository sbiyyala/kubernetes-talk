#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import time
import requests

last_response = ""
def main(argv):
    global last_response
    while (True):
        response = requests.get(argv[1])
        print "Status Code: %s"%(response.status_code)
        text = response.text
        if last_response != text:
            print "====\nRecieved a rolling update\n==="
            last_response = text
        print text
        time.sleep(2)

if __name__ == '__main__':
   exit(main(sys.argv))
