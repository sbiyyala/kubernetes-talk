#! /bin/bash

run_master="kubectl create -f redis-master-deployment.yaml"
run_slave="kubectl create -f redis-slave-deployment.yaml"
run_frontend="kubectl create -f frontend-deployment.yaml"

echo $run_master
`$run_master`

echo $run_slave
`$run_slave`

echo $run_frontend
`$run_frontend`
