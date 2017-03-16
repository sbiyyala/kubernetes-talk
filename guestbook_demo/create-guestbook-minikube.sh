#! /bin/bash
kubectl create -f redis-master-deployment.yaml
kubectl create -f redis-slave-deployment-minikube.yaml
kubectl create -f frontend-deployment-minikube.yaml
