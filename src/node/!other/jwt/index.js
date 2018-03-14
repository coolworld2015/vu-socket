'use strict';

var express = require('express');
var bodyParser = require('body-parser');
const PORT = process.env.PORT || 3000;

//------------------------------------------------------------------------
var jwt = require('jsonwebtoken');
var secret = 'f3oLigPb3vGCg9lgL0Bs97wySTCCuvYdOZg9zqTY32o';
var token = jwt.sign({auth:  'magic'}, secret, { expiresIn: 60 * 60 });

setInterval(function(){
	token = jwt.sign({auth:  'magic'}, secret, { expiresIn: 60 * 60 });
	}, 1000 * 60 * 60);

//------------------------------------------------------------------------
const server = express()
	.use( (req, res, next) => {
		res.header('Access-Control-Allow-Origin', '*'); 
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');  
		res.header('Access-Control-Allow-Headers', 'Content-Type, accept, authorization'); 
		next();
	})
	.use(bodyParser({limit: '50mb'}))
	
	.get('/',(req, res) => res.sendFile(__dirname + '/auth.html'))
 
	.get('/api/items/get', (req, res) => res.send('Items...'))	
	.get('/api/audit/get', (req, res) => res.send('Audit...'))
	
	.post('/api/login', Login)
	.get('/api/users/get', Users)
	.get('/api/messages/get', Messages)
	.get('/api/auth', (req, res) => res.send(token))
 
	.listen(PORT, () => console.log(`Listening on ${ PORT }`))

//------------------------------------------------------------------------
var SocketServer = require('ws').Server;
var webSocketServer = new SocketServer({ server });
var clients = {};

webSocketServer.on('connection', (ws) => {
	var id = +new Date();
	clients[id] = ws;
	console.log('new connection ' + id);
	
	var timeID = setInterval(function() {
		ws.send('still alive', function() {  })
	}, 30000)

	ws.on('close', function() {
		console.log('connection closed ' + id);
		delete clients[id];
	});

	ws.on('message', function(message) {
		
		// Message start
				var MessagesModel = require('./mongo').MessagesModel;
				var date = new Date().toJSON().slice(0, 10);
				var time = new Date().toTimeString().slice(0, 8);
				var now = date + ' ' + time;
				MessagesModel.create({
						id: + new Date(),
						name: 'TEST req.body.name',
						date: now,
						message: message
				});
		// Message end
				
		console.log('message received ' + message + '###' + now);
		for (var key in clients) {
			clients[key].send(message + '###' + now);
			//this.send(message);
		}
	});  
});

//------------------------------------------------------------------------
 function Messages(req, res) {
	var agent = req.headers.authorization;
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			var MessagesModel = require('./mongo').MessagesModel;
			return MessagesModel.find(function (err, messages) {
				if (!err) {
					return res.send(messages);
				} else {
					res.statusCode = 500;
					return res.send({error: 'Server error'});
				}
			}).limit(1000);
		}
	});
 }

 function Login(req, res) {
	var UsersModel = require('./mongo').UsersModel;
    UsersModel.findOne({ name: req.body.name }, function (err, user) {
        if (err) {
            res.send({error: err.message});
        } 
		if (user) {
			if (user.pass == req.body.pass) {

				// Audit start
				var AuditModel = require('./mongo').AuditModel;
				var date = new Date().toJSON().slice(0, 10);
				var time = new Date().toTimeString().slice(0, 8);
				AuditModel.create({
						id: + new Date(),
						name: req.body.name,
						date: date + ' ' + time,
						ip: req.ip,
						description: req.body.description
				},
				function (err, audit) {
					if (err) {
						return res.send({error: 'Server error'});
					} else {
						res.send({token: token}); // Send TOKEN here !!!
					}
				});
				// Audit end
			} else {
				res.status(403).send({ 
					success: false, 
					message: 'No such pass.' 
				});
			}
		} else {
			res.status(403).send({ 
				success: false, 
				message: 'No such user.' 
			});
		}

    });
 }
 
 function Users(req, res) {
	var agent = req.headers.authorization;
	//console.log('agent - ' + agent);
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			//console.log(decoded);
			var UsersModel = require('./mongo').UsersModel;
			return UsersModel.find(function (err, users) {
				if (!err) {
					return res.send(users);
				} else {
					res.statusCode = 500;
					return res.send({error: 'Server error'});
				}
			});
		}
	});
}
/*
//------------------------------------------------------------------------
app.get('/api/users/get', function(req, res) {
	var agent = req.headers.authorization;
	//console.log('agent - ' + agent);
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			//console.log(decoded);
			var UsersModel = require('./mongo').UsersModel;
			return UsersModel.find(function (err, users) {
				if (!err) {
					return res.send(users);
				} else {
					res.statusCode = 500;
					return res.send({error: 'Server error'});
				}
			});
		}
	});
});

app.post('/api/users/add', function(req, res) {
	var agent = req.body.authorization;
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			var UsersModel = require('./mongo').UsersModel;
			UsersModel.create({
					id: req.body.id,
					name: req.body.name,
					pass: req.body.pass,
					description: req.body.description
				},
				function (err, user) {
					if (err) {
						return res.send({error: 'Server error'});
					}
					res.send(user);
				});
		}
	});
});

app.post('/api/users/update', function(req, res) {
	var agent = req.body.authorization;
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			var UsersModel = require('./mongo').UsersModel;
			UsersModel.findOne({
				id: req.body.id
			}, function (err, user) {
				if (err) {
					res.send({error: err.message});
				} else {
					user.name = req.body.name;
					user.pass = req.body.pass;
					user.description = req.body.description;

					user.save(function (err) {
						if (!err) {
							res.send(user);
						} else {
							return res.send(err);
						}
					});
				}	
			});
		}
	});
});

app.post('/api/users/delete', function(req, res) {
	var agent = req.body.authorization;
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			var UsersModel = require('./mongo').UsersModel;
			UsersModel.remove({
				"id": req.body.id
			}, 
			function (err) {
				if (err) {
					return res.send({error: 'Server error'});
				} else {
					console.log('User with id: ', req.body.id, ' was removed');
					res.send('User with id: ' + req.body.id + ' was removed');
				}
			});
		}
	});
});

//------------------------------------------------------------------------
app.get('/api/audit/get', function(req, res) {
	var agent = req.headers.authorization;
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			var AuditModel = require('./mongo').AuditModel;
			return AuditModel.find(function (err, users) {
				if (!err) {
					return res.send(users);
				} else {
					res.statusCode = 500;
					return res.send({error: 'Server error'});
				}
			}).sort({date: -1}); 
		}
	});
});

app.post('/api/audit/add', function(req, res) {
	var agent = req.body.authorization;
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			var AuditModel = require('./mongo').AuditModel;
			var date = new Date().toJSON().slice(0, 10);
			var time = new Date().toTimeString().slice(0, 8);
			AuditModel.create({
					id: req.body.id,
					name: req.body.name,
					date: date + ' ' + time,
					ip: req.ip,
					description: req.body.description
				},
				function (err, audit) {
					if (err) {
						return res.send({error: 'Server error'});
					} else {
						res.send(audit);
					}
				});
		}
	});	
});

//------------------------------------------------------------------------
app.get('/api/items/get', function(req, res) {
	var agent = req.headers.authorization;
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			var ItemsModel = require('./mongo').ItemsModel;
			return ItemsModel.find(function (err, users) {
				if (!err) {
					return res.send(users);
				} else {
					res.statusCode = 500;
					return res.send({error: 'Server error'});
				}
			}).limit(1000);
		}
	});
});

app.get('/api/items/findByName/:name', function(req, res) {
	var agent = req.headers.authorization;
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			var ItemsModel = require('./mongo').ItemsModel;
			ItemsModel.find({
				"name": new RegExp(req.params.name, 'i')
			}, function (err, items) {
				if (err) {
					res.send({error: err.message});
				} else {
					console.log('mongo - ' + items.length);
					res.send(items);
				}
			});
		}
	});
});

app.get('/api/items/findByPhone/:name', function(req, res) {
	var agent = req.headers.authorization;
	
	jwt.verify(agent, secret, function(err, decoded) {
		if (err) {
			return res.status(403).send({ 
				success: false, 
				message: 'No token provided.' 
			});
		} else {
			var ItemsModel = require('./mongo').ItemsModel;
			ItemsModel.find({
				"phone": new RegExp(req.params.name)
			}, function (err, items) {
				if (err) {
					res.send({error: err.message});
				} else {
					console.log('mongo - ' + items.length);
					res.send(items);
				}
			});
		}
	});
});

*/