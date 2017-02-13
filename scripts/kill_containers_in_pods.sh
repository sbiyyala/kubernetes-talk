#! /bin/bash

echo "killing all node processes in containers belonging to pod: $1"
kubectl exec $1 ./kill_containers.sh
