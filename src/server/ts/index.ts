
const ServerApp = require('./app.js');
/*var ip = require("ip");
console.log("http://"+ip.address() );*/



 new ServerApp().start();
/*
var fb = firebase.initializeApp({ 
    apiKey: "AIzaSyCCtm2Zf7Hb6SjKRxwgwVZM5RfD64tODls",
    authDomain: "home-automation-80eec.firebaseapp.com",
    databaseURL: "https://home-automation-80eec.firebaseio.com",
    projectId: "home-automation-80eec",
    storageBucket: "home-automation-80eec.appspot.com",
    messagingSenderId: "970359498290",
    appId: "1:970359498290:web:a43e83568b9db8eb783e2b",
    measurementId: "G-YTRZ79TCJJ"
});*/
/*console.log("ASD0");
console.log("ASD",app);
console.log("ASD2",app.database());
console.log("ASD3",firebase.database());*/

/*

firebase.database().ref("/Ay9EuCEgoGOZYhFApXU2jczd0X32").once('value')
.then((snapshot) => {
    console.log(snapshot.val());
})
.catch((value) => {
    console.log(new Error("Error in Firebase.getDBData()"));
});

setTimeout(() => {
    firebase.auth().signInWithEmailAndPassword("marek.petr10@seznam.cz", "Automation123")
    .then((user) => {
        let fs = require('fs');
        fs.writeFile("ASD.txt", JSON.stringify(firebase.auth().currentUser), ()=>{});
        fs.writeFile("ASD2.txt", JSON.stringify(user), ()=>{});
        console.log("token", firebase.auth().currentUser.uid);
        //console.log("USER:", firebase.auth().currentUser);
        console.log("USER:", firebase.auth().currentUser.uid);
        firebase.database().ref(firebase.auth().currentUser.uid).on('value', (snapshot) => {
            const data = snapshot.val();
            console.log(data);
        });
    }).catch((error) => {
        console.log('error user: ', error);
    });
}, 3000);

*/


