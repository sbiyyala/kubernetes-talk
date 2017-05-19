#! /bin/bash

cmd="docker-compose -f guestbook-compose.yml up -d"
echo $cmd
`$cmd`

