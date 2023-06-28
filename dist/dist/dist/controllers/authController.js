// const usersDB = {
//     users: require('../model/users.json'),
//     setUsers: function (data) { this.users = data }
// }
const bcrypt = require('bcrypt');
const {
  createClient
} = require('@sanity/client');
const client = createClient({
  projectId: '3iouolde',
  dataset: 'production',
  apiVersion: '2021-09-18',
  // The API version you are using
  useCdn: false // Set to true if you want to enable the Content Delivery Network (CDN)
});

const jwt = require('jsonwebtoken');
require('dotenv').config();
const fsPromises = require('fs').promises;
const path = require('path');
const {
  postData
} = require('../routes/api/sanity');
const handleLogin = async (req, res) => {
  const {
    user,
    pwd
  } = req.body;
  console.log("User 1:" + user);
  console.log("Password 1 :" + pwd);
  if (!user || !pwd) return res.status(400).json({
    'message': 'Username and password are required.'
  });

  // fetch the user from sanity
  client.fetch('*[_type == "user" && email == $user]', {
    user
  }) // Replace "your-data-type" with the actual type you want to query
  .then(data => {
    // Handle the fetched data
    console.log(data);
    data.forEach(user => {
      // Access and display the desired fields
      console.log('User:', user.name);
      console.log('Email:', user.email);
      console.log('refreshToken:', user.refreshToken);
      console.log('role:', user.role);
      console.log('password:', user.password);
      if (!user) return res.sendStatus(401); //Unauthorized 
      // evaluate password 
      const match = bcrypt.compare(pwd, user.password);
      if (match) {
        const roles = Object.values(user.role);
        // create JWTs
        const accessToken = jwt.sign({
          "UserInfo": {
            "username": user.name,
            "roles": roles
          }
        }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '30s'
        });
        const refreshToken = jwt.sign({
          "username": user.name
        }, process.env.REFRESH_TOKEN_SECRET, {
          expiresIn: '1d'
        });
        // Saving refreshToken with current user
        const currentUser = {
          "name": user.name,
          "email": user.email,
          "password": user.password,
          "role": user.role,
          "image": user.image,
          "refreshToken": refreshToken
        };
        res.cookie('jwt', refreshToken, {
          httpOnly: true,
          sameSite: 'None',
          secure: true,
          maxAge: 24 * 60 * 60 * 1000
        });
        res.json({
          accessToken,
          user: currentUser
        });
      } else {
        return res.status(500).json({
          'message': 'Incorrect email or password.'
        });
      }
      //   console.log('Address:', user.address);
      console.log('---');
    });
  }).catch(error => {
    // Handle any errors that occur during the fetch
    console.error('Error:', error);
  });
};
module.exports = {
  handleLogin
};