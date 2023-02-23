const express = require("express");
const chalk = require("chalk");
const http = require("http");
const { Server } = require("socket.io");
const port = 3700;

const { AttributeIds, OPCUAClient, TimestampsToReturn } = require("node-opcua");
var nodesToWrite = [{
    nodeId: "ns=4;s=Robot1/Temperature",
    attributeId: AttributeIds.Value,
    indexRange: null,
    value: {
        value: {
            dataType: "Double",
            value: "0"
                }
        }
    },
    {
        nodeId: "ns=4;s=Robot1/Position",
        attributeId: AttributeIds.Value,
        indexRange: null,
        value: {
            value: {
                dataType: "Double",
                value: "11"
            }
        }
    },
    {
        nodeId: "ns=4;s=Robot1/Position",
        attributeId: AttributeIds.Value,
        indexRange: null,
        value: {
            value: {
                dataType: "Double",
                value: "22"
            }
        }
    },
    {
        nodeId: "ns=4;s=Robot1/Position",
        attributeId: AttributeIds.Value,
        indexRange: null,
        value: {
            value: {
                dataType: "Double",
                value: "33"
            }
        }
    },
    {
        nodeId: "ns=4;s=Robot1/Position",
        attributeId: AttributeIds.Value,
        indexRange: null,
        value: {
            value: {
                dataType: "Double",
                value: "44"
            }
        }
    },
    {
        nodeId: "ns=4;s=Robot1/Position",
        attributeId: AttributeIds.Value,
        indexRange: null,
        value: {
            value: {
                dataType: "Double",
                value: "55"
            }
        }
    }];
const hostname = require("os").hostname().toLowerCase();
// const endpointUrl = "opc.tcp://" + hostname + ":26543/UA/SampleServer";
//const endpointUrl = "opc.tcp://opcuademo.sterfive.com:26543/UA/SampleServer";
const endpointUrl = "opc.tcp://localhost:4880/";
const nodeIdToMonitor = "ns=4;s=Robot1/Temperature";
const node1IdToMonitor = "ns=4;s=Robot1/Position";

let client, session, subscription;

async function createOPCUAClient(io) {
  client = OPCUAClient.create({
    endpointMustExist: false,
  });
  client.on("backoff", (retry, delay) => {
    console.log("Retrying to connect to ", endpointUrl, " attempt ", retry);
  });
  console.log(" connecting to ", chalk.cyan(endpointUrl));
  await client.connect(endpointUrl);
  console.log(" connected to ", chalk.cyan(endpointUrl));

  session = await client.createSession();
  console.log(" session created".yellow);

  subscription = await session.createSubscription2({
    requestedPublishingInterval: 250,
    requestedMaxKeepAliveCount: 50,
    requestedLifetimeCount: 6000,
    maxNotificationsPerPublish: 1000,
    publishingEnabled: true,
    priority: 10,
  });
    //var nodesToWrite = [{
    //    nodeId: "ns=4;s=Robot1/Temperature",
    //    attributeId: AttributeIds.Value,
    //    indexRange: null,
    //    value: {
    //        value: {
    //            dataType: "Double",
    //            value: "11"
    //        }
    //    }
    //}];
    //session.write(nodesToWrite, function (err, statusCode, diagnosticInfo) {
    //    if (!err) {
    //        console.log(" write ok");
    //        console.log(nodesToWrite[0])
    //        console.log(diagnosticInfo);
    //        console.log(statusCode);
    //    }
    //});
  subscription
    .on("keepalive", function () {
      console.log("keepalive");
    })
    .on("terminated", function () {
      console.log(" TERMINATED ------------------------------>");
    });

  const itemToMonitor = {
    nodeId: nodeIdToMonitor,
    attributeId: AttributeIds.Value,
    };
    const item1ToMonitor = {
        nodeId: node1IdToMonitor,
        attributeId: AttributeIds.Value,
    };
  const parameters = {
    samplingInterval: 100,
    discardOldest: true,
    queueSize: 100,
  };
  const monitoredItem = await subscription.monitor(
    itemToMonitor,
    parameters,
    TimestampsToReturn.Both
    );
    const monitoredItem1 = await subscription.monitor(
        item1ToMonitor,
        parameters,
        TimestampsToReturn.Both
    );

  monitoredItem.on("changed", (dataValue) => {
      console.log(dataValue.value.toString());
      //console.log(dataValue.attributeid.toString());
    io.sockets.emit("temp", {
      value: dataValue.value.value,
      timestamp: dataValue.serverTimestamp,
      nodeId: nodeIdToMonitor,
      browseName: "Temperature",
    });
  });
monitoredItem1.on("changed", (dataValue) => {
    console.log("Position: " + dataValue.value.toString());
    io.sockets.emit("pos", {
        value: dataValue.value.value,
        timestamp: dataValue.serverTimestamp,
        nodeId: node1IdToMonitor,
        browseName: "Position",
    });
});
    AttriId_value = AttributeIds.Value;
}

async function stopOPCUAClient() {
  if (subscription) await subscription.terminate();
  if (session) await session.close();
  if (client) await client.disconnect();
}

(async () => {
  try {
    // --------------------------------------------------------
    const app = express();
    app.set("view engine", "html");
    app.use(express.static(__dirname + "/"));
    app.set("views", __dirname + "/");
    app.get("/", function (req, res) {
      res.render("index.html");
    });
    app.use(express.static(__dirname + "/"));

    const server = http.createServer(app);

    const io = new Server(server);
      io.sockets.on("connection", function (socket) {
          socket.on('send-chat-message', message => {
              console.log(message);
              socket.emit('received-chat-message', message);
          });
          socket.on('SVON', message => {
              console.log("SVON " + message);
              session.write(nodesToWrite[0], function (err, statusCode, diagnosticInfo) {
                  if (!err) {
                      console.log(" write ok");
                      console.log(nodesToWrite[0])
                      console.log(diagnosticInfo);
                      console.log(statusCode);
                  }
              });
          });
          socket.on('SVOFF', message => {
              console.log("SVOFF " + message);
              session.write(nodesToWrite[1], function (err, statusCode, diagnosticInfo) {
                  if (!err) {
                      console.log(" write ok");
                      console.log(nodesToWrite[1])
                      console.log(diagnosticInfo);
                      console.log(statusCode);
                  }
              });
          });
          socket.on('Sel_Cor', message => {
              console.log("Sel_Cor: " + message);
              //if (message == "Joint Coordinates") {
              //    session.write(nodesToWrite[2], function (err, statusCode, diagnosticInfo) {
              //        if (!err) {
              //            console.log(" write ok");
              //            console.log(nodesToWrite[2])
              //            console.log(diagnosticInfo);
              //            console.log(statusCode);
              //        }
              //    });
              //}
              //else if (message == "Cartesian Coordinates"){
              //    session.write(nodesToWrite[3], function (err, statusCode, diagnosticInfo) {
              //        if (!err) {
              //            console.log(" write ok");
              //            console.log(nodesToWrite[3])
              //            console.log(diagnosticInfo);
              //            console.log(statusCode);
              //        }
              //    });
              //}
              switch (message) {
                  case "Joint Coordinates":
                      session.write(nodesToWrite[2], function (err, statusCode, diagnosticInfo) {
                          if (!err) {
                              console.log(" write ok");
                              console.log(nodesToWrite[2])
                              console.log(diagnosticInfo);
                              console.log(statusCode);
                          }
                      });
                      break;
                  case "Cartesian Coordinates":
                      session.write(nodesToWrite[3], function (err, statusCode, diagnosticInfo) {
                          if (!err) {
                              console.log(" write ok");
                              console.log(nodesToWrite[3])
                              console.log(diagnosticInfo);
                              console.log(statusCode);
                          }
                      });
                      break;
                  case "Tool Coordinates":

                      break;
                  case "User Coordinates":

                      break;
                  default:

              }
          });
          socket.on('pressed', message => {
              console.log(message + " pressed");
              switch (message) {
                  case 'J1_neg':
                      session.write(nodesToWrite[4], function (err, statusCode, diagnosticInfo) {
                          if (!err) {
                              console.log(" write ok");
                              console.log(nodesToWrite[4])
                              console.log(diagnosticInfo);
                              console.log(statusCode);
                          }
                      });
                      break;
                  case 'J1_pos':

                      break;
                  case 'J2_neg':

                      break;
                  case 'J2_pos':

                      break;
                  case 'J3_neg':

                      break;
                  case 'J3_pos':

                      break;
                  case 'J4_neg':

                      break;
                  case 'J4_pos':

                      break;
                  case 'J5_neg':

                      break;
                  case 'J5_pos':

                      break;
                  case 'J6_neg':

                      break;
                  case 'J6_pos':

                      break;

                  default:
                      console.log("Undefined message");
              }
          });
          socket.on('released', message => {
              console.log(message + " released");
              switch (message) {
                  case 'J1_neg':
                      session.write(nodesToWrite[5], function (err, statusCode, diagnosticInfo) {
                          if (!err) {
                              console.log(" write ok");
                              console.log(nodesToWrite[5])
                              console.log(diagnosticInfo);
                              console.log(statusCode);
                          }
                      });
                      break;
                  case 'J1_pos':

                      break;
                  case 'J2_neg':

                      break;
                  case 'J2_pos':

                      break;
                  case 'J3_neg':

                      break;
                  case 'J3_pos':

                      break;
                  case 'J4_neg':

                      break;
                  case 'J4_pos':

                      break;
                  case 'J5_neg':

                      break;
                  case 'J5_pos':

                      break;
                  case 'J6_neg':

                      break;
                  case 'J6_pos':

                      break;

                  default:
                      console.log("Undefined message");
              }
          })
      });

    server.listen(port, () => {
      console.log("Listening on port " + port);
      console.log("visit http://localhost:" + port);
    });

    // --------------------------------------------------------
    createOPCUAClient(io);

    // detect CTRL+C and close
    process.once("SIGINT", async () => {
      console.log("shutting down client");

      await stopOPCUAClient();
      console.log("Done");
      process.exit(0);
    });
  } catch (err) {
    console.log(chalk.bgRed.white("Error" + err.message));
    console.log(err);
    process.exit(-1);
  }
})();
