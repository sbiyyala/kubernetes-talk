'use strict';

/**
 Copyright 2014 Google Inc. All rights reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

const truncate = (str, width, left) => {
  if (!str) return "";

  if (str.length > width) {
    if (left) {
      return str.slice(0, width) + "...";
    } else {
      return "..." + str.slice(str.length - width, str.length);
    }
  } else {
    return str;
  }
};

var pods = [];
var services = [];
var controllers = [];
var deployments = [];
var nodes = [];
var uses = {};

var groups = {};

const insertByName = (index, value) => {
  // console.log("type = " + value.type + " labels = " + value.metadata.name);
  //	var list = groups[value.metadata.name];
  var key = value.metadata.labels.app ? value.metadata.labels.app : value.metadata.labels.run;
  var list = groups[key];
  if (!list) {
    list = [];
    groups[key] = list;
  }
  list.push(value);
};

const groupByName = () => {
  const entityArray = [pods.items, controllers.items, deployments.items, services.items];
  entityArray.filter(Boolean)
      .forEach(array => $.each(array, insertByName));
};

const matchesLabelQuery = (labels, selector) => {
  let match = true;
  $.each(selector, (key, value) => {
    if (labels[key] != value) {
      match = false;
    }
  });

  return match;
};

var connectDeployments = () => {
  //connectUses();

  if (deployments.items) {
    for (let i = 0; i < deployments.items.length; i++) {
      var deployment = deployments.items[i];
      for (let j = 0; j < pods.items.length; j++) {
        var pod = pods.items[j];
        if (matchesLabelQuery(pod.metadata.labels, deployment.spec.selector.matchLabels)) {
          //console.log('connect controller: ' + 'controller-' + controller.metadata.name + ' to pod-' + pod.metadata.name);
          jsPlumb.connect({
            source: 'deployment-' + deployment.metadata.name,
            target: 'pod-' + pod.metadata.name,
            anchors: ["Bottom", "Bottom"],
            paintStyle: {lineWidth: 3, strokeStyle: 'rgb(51,105,232)'},
            joinStyle: "round",
            endpointStyle: {fillStyle: 'rgb(51,105,232)', radius: 5},
            connector: ["Flowchart", {cornerRadius: 3}]
          });

          jsPlumb.draggable('pod-' + pod.metadata.name, {containment:"parent"});
          jsPlumb.draggable('deployment-' + deployment.metadata.name, {containment:"parent"});
        }
      }
    }
  }

  if (services.items) {
    for (let i = 0; i < services.items.length; i++) {
      var service = services.items[i];
      for (let j = 0; j < pods.items.length; j++) {
        const pod = pods.items[j];
        if (matchesLabelQuery(pod.metadata.labels, service.spec.selector)) {
          jsPlumb.connect(
              {
                source: 'service-' + service.metadata.name,
                target: 'pod-' + pod.metadata.name,
                anchors: ["Bottom", "Top"],
                paintStyle: {lineWidth: 3, strokeStyle: 'rgb(0,153,57)'},
                endpointStyle: {fillStyle: 'rgb(0,153,57)', radius: 7},
                connector: ["Flowchart", {cornerRadius: 3}]
              });

          jsPlumb.draggable('service-' + service.metadata.name, {containment:"parent"});
          jsPlumb.draggable('pod-' + pod.metadata.name, {containment:"parent"});
        }
      }
    }
  }
};

const colors = [
  'rgb(213,15,37)',
  'rgb(238,178,17)',
  'rgb(17,178,238)'
];

const connectUses = () => {
  let colorIx = 0;
  let keys = [];

  $.each(uses, key => keys.push(key));

  keys.sort((a, b) => a > b);

  $.each(keys, idx => {
    let key = keys[idx];
    let list = uses[key];
    let color = colors[colorIx];
    colorIx++;
    if (colorIx >= colors.length) {
      colorIx = 0;
    }
    $.each(pods.items, (i, pod) => {
      const podKey = pod.metadata.labels.app ? pod.metadata.labels.app : pod.metadata.labels.run;
      if (podKey == key) {
        $.each(list, (j, serviceId) => {
          //console.log('connect: ' + 'pod-' + pod.metadata.name + ' to service-' + serviceId);
          jsPlumb.connect(
              {
                source: 'pod-' + pod.metadata.name,
                target: 'service-' + serviceId,
                endpoint: "Blank",
                //anchors:["Bottom", "Top"],
                anchors: [[0.5, 1, 0, 1, -30, 0], "Top"],
                //connector: "Straight",
                connector: ["Bezier", {curviness: 75}],
                paintStyle: {lineWidth: 2, strokeStyle: color},
                overlays: [
                  ["Arrow", {width: 15, length: 10, location: 0.3}],
                  ["Arrow", {width: 15, length: 10, location: 0.6}],
                  ["Arrow", {width: 15, length: 10, location: 1}]
                ]
              });

          jsPlumb.draggable('pod-' + pod.metadata.name, {containment:"parent"});
          jsPlumb.draggable('service-' + serviceId, {containment:"parent"});

        });
      }
    });
  });
};

const makeGroupOrder = () => {
  var groupScores = {};
  $.each(groups, key => {
    //console.log("group key: " + key);
    if (!groupScores[key]) {
      groupScores[key] = 0;
    }

    if (uses[key]) {
      const value = uses[key];
      $.each(value, (ix, uses_label) => {
        if (!groupScores[uses_label]) {
          groupScores[uses_label] = 1;
        } else {
          groupScores[uses_label]++;
        }
      });
    } else {
      if (!groupScores["no-service"]) {
        groupScores["no-service"] = 1;
      } else {
        groupScores["no-service"]++;
      }
    }
  });

  var groupOrder = [];
  $.each(groupScores, key => {
    groupOrder.push(key);
  });

  groupOrder.sort((a, b) => groupScores[a] - groupScores[b]);

  return groupOrder;
};

const renderNodes = () => {
  var y = 25;
  var x = 100;
  $.each(nodes.items, (index, value) => {

    const div = $('<div/>');
    let ready = 'not_ready';
    $.each(value.status.conditions, (index, condition) => {
      if (condition.type === 'Ready') {
        ready = (condition.status === 'True' ? 'ready' : 'not_ready' )
      }
    });

    const eltDiv = $('<div class="window node ' + ready + '" title="' + value.metadata.name + '" id="node-' + value.metadata.name +
        '" style="left: ' + (x + 250) + '; top: ' + y + '"/>');
    eltDiv.html('<span><b>Node</b><br/><br/>' +
        truncate(value.metadata.name, 6) +
        '</span>');
    div.append(eltDiv);

    const elt = $('.nodesbar');
    elt.append(div);

    x += 120;
  });
};

const renderGroups = () => {
  var elt = $('#sheet');
  var y = 10;
  var serviceLeft = 0;
  var groupOrder = makeGroupOrder();
  var counts = {};
  $.each(groupOrder, (ix, key) => {
    const list = groups[key];
    if (!list) {
      return;
    }
    var div = $('<div/>');
    var x = 100;
    $.each(list, (index, value) => {
      //console.log("render groups: " + value.type + ", " + value.metadata.name + ", " + index);
      var eltDiv = null;
      var phase = value.status.phase ? value.status.phase.toLowerCase() : '';
      if (value.type === "pod") {
        if ('deletionTimestamp' in value.metadata || anyDeadContainers(value)) {
          phase = 'terminating';
        }

        eltDiv = $('<div class="window pod ' + phase + '" title="' + value.metadata.name + '" id="pod-' + value.metadata.name +
            '" style="left: ' + (x + 250) + '; top: ' + (y + 160) + '"/>');
        eltDiv.html('<span>' +
            truncate(value.metadata.name, 8, true) +
            (value.metadata.labels.version ? "<br/>" + value.metadata.labels.version : "") + "<br/>" +
            (value.status.podIP ? value.status.podIP : "") + "<br/><br/>" +
            "(" + (value.spec.nodeName ? truncate(value.spec.nodeName, 6) : "None") + ")" +
            '</span>');
      } else if (value.type === "service") {

        eltDiv = $('<div class="window wide service ' + phase + '" title="' + value.metadata.name + '" id="service-' + value.metadata.name +
            '" style="left: ' + 75 + '; top: ' + y + '"/>');
        eltDiv.html('<span>' +
            value.metadata.name +
            (value.metadata.labels.version ? "<br/><br/>" + value.metadata.labels.version : "") +
            (value.spec.clusterIP ? "<br/><br/>" + value.spec.clusterIP : "") +
            (value.status.loadBalancer && value.status.loadBalancer.ingress ? "<br/><a style='color:white; text-decoration: underline' href='http://" + value.status.loadBalancer.ingress[0].ip + "'>" + value.status.loadBalancer.ingress[0].ip + "</a>" : "") +
            '</span>');
      } else if (value.type === "deployment") {

        var key = 'deployment-' + (value.metadata.labels.app ? value.metadata.labels.app : value.metadata.labels.run);
        counts[key] = key in counts ? counts[key] + 1 : 0;
        //eltDiv = $('<div class="window wide controller" title="' + value.metadata.name + '" id="controller-' + value.metadata.name +
        //	'" style="left: ' + (900 + counts[key] * 100) + '; top: ' + (y + 100 + counts[key] * 100) + '"/>');
        var minLeft = 900;
        var calcLeft = 400 + (value.status.replicas * 130);
        var left = minLeft > calcLeft ? minLeft : calcLeft;
        eltDiv = $('<div class="window wide controller" title="' + value.metadata.name + '" id="deployment-' + value.metadata.name +
            '" style="left: ' + (left + counts[key] * 100) + '; top: ' + (y + 100 + counts[key] * 100) + '"/>');
        eltDiv.html('<span>' +
            value.metadata.name +
            (value.metadata.labels.version ? "<br/><br/>" + value.metadata.labels.version : "") +
            '</span>');
      }

      div.append(eltDiv);
      x += 130;
    });
    y += 400;
    serviceLeft += 200;
    elt.append(div);
  });
};

const anyDeadContainers = value => value.status.containerStatuses && value.status.containerStatuses.some((x => x.ready === false));

const insertUse = (name, use) => {
  for (var i = 0; i < uses[name].length; i++) {
    if (uses[name][i] == use) {
      return;
    }
  }
  uses[name].push(use);
};

const loadData = () => {
  var deferred = new $.Deferred();

  const req1 = $.getJSON("/api/v1/namespaces/default/pods?labelSelector=visualize%3Dtrue", data => {
    pods = data;

    if (data.items) {
      $.each(data.items, (key, val) => {
        val.type = 'pod';
        if (val.metadata.labels && val.metadata.labels.uses) {
          const key = val.metadata.labels.uses;
          if (!uses[key]) {
            uses[key] = key.split(",");
          } else {
            $.each(key.split(","), (ix, use) => insertUse(key, use));
          }
        }
      });
    }
  });

  const req3 = $.getJSON("/api/v1/namespaces/default/services?labelSelector=visualize%3Dtrue", data => {
    services = data;

    if (data.items) {
      $.each(data.items, (key, val) => {
        val.type = 'service';
        //console.log("service ID = " + val.metadata.name)
      });
    }
  });

  const req4 = $.getJSON("/api/v1/nodes", data => {
    nodes = data;

    if (data.items) {
      $.each(data.items, (key, val) => {
        val.type = 'node';
        //console.log("service ID = " + val.metadata.name)
      });
    }
  });

  const req5 = $.getJSON("/apis/extensions/v1beta1/namespaces/default/deployments?labelSelector=visualize%3Dtrue", data => {

    deployments = data;

    if (data.items) {
      $.each(data.items, (key, val) => {
        val.type = 'deployment';
        //console.log("Controller ID = " + val.metadata.name)
      });
    }
  });

  $.when(req1, req3, req4, req5).then( () => {
    deferred.resolve();
  });


  return deferred;
};

function refresh(instance) {
  pods = [];
  services = [];
  controllers = [];
  deployments = [];
  nodes = [];
  uses = {};
  groups = {};


  $.when(loadData())
      .then(() => {
        try {
          groupByName();
          $('#sheet').empty();
          renderNodes();
          renderGroups();
          connectDeployments();

        } finally {
          setTimeout(() => {
            refresh(instance);
          }, 1000);
        }
      });
}

jsPlumb.bind("ready", () => {
  var instance = jsPlumb.getInstance({
    // default drag options
    DragOptions: {cursor: 'pointer', zIndex: 2000},
    // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
    // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
    ConnectionOverlays: [
      ["Arrow", {location: 1}]
      [ "Label", {
      	location:0.1,
      	id:"label",
      	cssClass:"aLabel"
      }]
    ],
    Container: "flowchart-demo",
    ConnectionsDetachable : true
  });

  refresh(instance);
  jsPlumb.fire("jsPlumbDemoLoaded", instance);

});
