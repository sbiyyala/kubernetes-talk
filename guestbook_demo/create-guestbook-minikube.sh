#! /bin/bash

set -x
kubectl create -f redis-master-deployment.yaml>/dev/null
kubectl create -f redis-slave-deployment-minikube.yaml>/dev/null
kubectl create -f frontend-deployment-minikube.yaml>/dev/null

# master="kubectl create -f redis-master-deployment.yaml"
# slave="kubectl create -f redis-slave-deployment-minikube.yaml"
# frontend="kubectl create -f frontend-deployment-minikube.yaml"

# echo $master
# `$master`

# echo $slave
# `$slave`

# echo $frontend
# `$frontend`
