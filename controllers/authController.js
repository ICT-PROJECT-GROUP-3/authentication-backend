const usersDB = {
    users: require('../model/users.json'),
    setUsers: function (data) { this.users = data }
}
const bcrypt = require('bcrypt');
const { createClient } = require('@sanity/client');


const client = createClient({
  projectId: '3iouolde',
  dataset: 'production',
  apiVersion: '2021-09-18', // The API version you are using
  useCdn: false, // Set to true if you want to enable the Content Delivery Network (CDN)
});

const jwt = require('jsonwebtoken');
require('dotenv').config();
const fsPromises = require('fs').promises;
const path = require('path');
const { postData } = require('../routes/api/sanity');

const handleLogin = async (req, res) => {
    const { user, pwd } = req.body;
    if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });
   
    // fetch the user from sanity
    client
  .fetch('*[_type == "user" && name == $user]', { user })// Replace "your-data-type" with the actual type you want to query
  .then((data) => {
    // Handle the fetched data
    console.log(data);
      data.forEach((user) => {
      // Access and display the desired fields
      console.log('User:', user.name);
      console.log('Email:', user.email);
      console.log('refreshToken:', user.refreshToken);
      console.log('role:', user.role);
      console.log('password:', user.password);

    // const foundUser = usersDB.users.find(person => person.username === user);
    if (!user) return res.sendStatus(401); //Unauthorized 
    // evaluate password 
    const match = bcrypt.compare(pwd, user.password);
    if (match) {
        const roles = Object.values(user.role);
        // create JWTs
        const accessToken = jwt.sign(
            { 
                "UserInfo":{
                "username": user.name,
                "roles":roles,
            }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30s' }
        );
        const refreshToken = jwt.sign(
            { "username": user.name },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );
        // Saving refreshToken with current user
        // const otherUsers = usersDB.users.filter(person => person.username !== foundUser.username);
        const currentUser = { 
            "name":user.name, 
            "email":user.email,
            "password": user.password,
            "role":user.role,
            "image":user.image,
            "refreshToken":refreshToken };
         
        // postData(currentUser)
const sanityApiKey =
  'skHK4SXyIt4zKcU6X6OIOaG2Zsb2ZYMvQk3oCMakw6KutBjRDje8EtUZVcDpIBSiGbF3cH26h46T9oH6GWg0VH6eDCHDg6uUX669PviEvtqfwTdrE4W7PuB00Mc6aWVq8S3up1LqUPkTeZOmVrtBX6yduClsbvwAceBJQTtRKzpnVZ5FGMuK';
const sanityProjectId = '3iouolde';
const sanityDataset = 'production';

try {
  const response = fetch(
    `https://${sanityProjectId}.api.sanity.io/v1/data/mutate/${sanityDataset}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sanityApiKey}`,
      },
      body: JSON.stringify({
        mutations: [
          {
            patch: {
              _type: 'user',
              set: {
               "refreshToken":refreshToken, // Spread the tutorData object to include all fields
            }, // Replace with your existing schema type "tutor"
              // Map the data fields to the corresponding fields in your "tutor" schema
            },
          },
        ],
      }),
    }
  );

  if (response.ok) {
    console.log('Data posted successfully!');
  } else {
    console.error('Error posting data:', response.statusText);
  }
} catch (error) {
  console.error('Error posting data:', error);
}

       
        // usersDB.setUsers([...otherUsers, currentUser]);
        //  fsPromises.writeFile(
        //     path.join(__dirname, '..', 'model', 'users.json'),
        //     JSON.stringify(usersDB.users)
        // );
        res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
        res.json({ accessToken, user:currentUser });
    } else {
        res.sendStatus(401);
    }
    //   console.log('Address:', user.address);
      console.log('---');
    });

  })
  .catch((error) => {
    // Handle any errors that occur during the fetch
    console.error('Error:', error);
  });
}

module.exports = { handleLogin };