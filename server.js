
const express = require('express');
const bodyparser = require("body-parser");
const app = express();
const jwt_secret = 'WU5CjF8fHxG40S2t7oyk';
const jwt_admin = 'SJwt25Wq62SFfjiw92sR';

var mongojs = require('mongojs')
app.use(bodyparser.json())
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var db = mongojs('localhost:27017/Card', ['Kartica'])
var port = process.env.PORT || 3000

app.use(express.static(__dirname + '/static'));
app.use(express.json()); // to support JSON-encoded bodies
app.use(bodyparser.json());
app.use(express.urlencoded({
    extended: true
})); 
var urlencodedParser = bodyparser.urlencoded({
  extended: false
})// to support URL-encoded bodies

app.use('/Card/',function(request,response,next){
  jwt.verify(request.get('JWT'), jwt_secret, function(error, decoded) {      
    if (error) {
      response.status(401).send('Unauthorized access');    
    } else {
      db.collection("users").findOne({'_id': new MongoId(decoded._id)}, function(error, user) {
        if (error){
          throw error;
        }else{
          if(user){
            next();
          }else{
            response.status(401).send('Credentials are wrong.');
          }
        }
      });
    }
  });  
})

app.use('/admin/',function(request,response,next){
  jwt.verify(request.get('JWT'), jwt_admin, function(error, decoded) {     
    if (error) {
      response.status(401).send('Unauthorized access'); 
      console.log(error);   
    } else {
      db.collection("users").findOne({'_id': new MongoId(decoded._id)}, function(error, users) {
        if (error){
          throw error;
        }else{
          if(users){
            next();
          }else{
            response.status(401).send('Credentials are wrong.');
          }
        }
      });
    }
  });  
})

app.post('/login', function(req, res) {
  var user = req.body;
  db.collection('users').findOne({
      'email': user.email,
  }, function(error, users) {
      if (error) {
          throw error;
      } 
      if(users) {
          bcrypt.compare(user.password, users.password, function(err, resp){
              if(resp === true){
                  if(users.type == "admin"){
                      var token = jwt.sign(users, jwt_admin, {
                          expiresIn: 60*60*24
                      });
                      res.send({
                          success: true,
                          message: 'Admin Authenticated',
                          token: token,
                          type : 'admin'
                      })
                      console.log("Admin authentication passed.");
                  }
                  else if(users.type == "user"){
                    users.password= null;
                      var token = jwt.sign(users, jwt_secret, {
                          expiresIn: 60*60*24
                      });
                      res.send({
                          success: true,
                          message: 'Authenticated',
                          token: token,
                          type: "user"
                      })
                      console.log("Authentication passed.");
                  }
              }
              else {
                  res.send({
                      user : false
                  })
              }
          })
      }
  });
});

app.post('/register', function(req, res, next) {
  req.body.type = "user";
  req.body._id = null;
  req.body.password_confirm = null;
  var user = req.body;
  var find = req.body.email;
  bcrypt.hash(user.password, 10, function(err, hash) {
      user.password = hash;
      db.collection('users').find({
        email : find
      }).toArray(function (err,result){
        if(err) throw err;

        console.log(result);

        if(result.length > 0){
          res.send(202);
        } else {
          db.collection('users').insert(user, function(err, data) {
              if (err) return console.log(err);
              res.setHeader('Content-Type', 'application/json');
              res.send(user);
          })
        }
  })
})
});


app.get('/Kartica', function (req, res) {
  db.Kartica.find(function (err, docs) {
    res.json(docs)
  })
})

app.post('/Kartica', urlencodedParser, function (req, res, next) {
  console.log(req.body)

  db.Kartica.insert(req.body, function (err, docs) {
    console.log('Card date inserted successfully')
    res.json(docs)
  })
})



 

app.delete('/deleteCard/:id', function (req, res) {
  var id = req.params.id
  console.log(id)
  db.Kartica.remove({
    _id: mongojs.ObjectId(id) 
  }, function (err, doc) {
    console.log('removed')
    res.json(doc)
  })
})


app.get('/Kartica/:id', urlencodedParser, function (req, res) {
  var id = req.params.id
  console.log(id)
  db.Kartica.findOne({
    _id: mongojs.ObjectId(id)
  }, function (err, doc) {
    console.log('selected')
    res.json(doc)
  })
})

app.put('/Kartica/:id', function (req, res) {
  var id = req.params.id
  console.log(req.body)
  db.Kartica.findAndModify({
    query: {
      _id: mongojs.ObjectId(id)
    },
    update: {
      $set: {
        Name: req.body.Name,
        Description: req.body.Description,
        Image: req.body.Image,
        BarCode: req.body.BarCode
      }
    },
    new: true
  }, function (err, doc) {
    console.log('updated')
    res.json(doc)
  })
})


app.listen(port, function () {
  console.log('Node app is running on port', port)
});