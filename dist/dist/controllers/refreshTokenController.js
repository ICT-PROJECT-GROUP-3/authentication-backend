const usersDB = {
  users: require('../model/users.json'),
  setUsers: function (data) {
    this.users = data;
  }
};
const jwt = require('jsonwebtoken');
require('dotenv').config();
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

const handleRefreshToken = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;
  client.fetch('*[_type == "user" && refreshToken == $refreshToken]', {
    refreshToken
  }) // Replace "your-data-type" with the actual type you want to query
  .then(data => {
    // Handle the fetched data
    console.log(data);
    data.forEach(user => {
      // Access and display the desired fields
      console.log('User:', user.name);
      console.log('Email:', user.email);
      //   console.log('Age:', user.password);
      // 
      // const foundUser = usersDB.users.find(person => person.refreshToken === refreshToken);
      if (!user) return res.sendStatus(403); //Forbidden 
      // evaluate jwt 
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
        if (err || user.name !== decoded.username) return res.sendStatus(403);
        const roles = Object.values(user.roles);
        const accessToken = jwt.sign({
          "UserInfo": {
            "username": decoded.username,
            "roles": roles
          }
        }, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '30s'
        });
        res.json({
          accessToken
        });
      });
      //   console.log('Address:', user.address);
      console.log('---');
    });
  }).catch(error => {
    // Handle any errors that occur during the fetch
    console.error('Error:', error);
  });
};
module.exports = {
  handleRefreshToken
};