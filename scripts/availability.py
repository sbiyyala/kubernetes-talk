#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
import time
import requests

def convert(url):
    if url.startswith('http://www.'):
        return 'http://' + url[len('http://www.'):]
    if url.startswith('www.'):
        return 'http://' + url[len('www.'):]
    if not url.startswith('http://'):
        return 'http://' + url
    return url

def main(argv):
    last_response = ""
    #global last_response
    while (True):
        try:
            response = requests.get(convert(argv[1]))
            print "Status Code: %s"%(response.status_code)
            text = response.text
            if last_response != text:
                if (bool(last_response)):
                    print "====\nRecieved a rolling update\n==="
                last_response = text
            print text
            time.sleep(1)
        except requests.exceptions.ConnectionError:
            print "Connection error"
            time.sleep(5)
        except KeyboardInterrupt:
            print "Caught KeyboardInterrupt, terminating process"
            sys.exit(-1)

if __name__ == '__main__':
   exit(main(sys.argv))
