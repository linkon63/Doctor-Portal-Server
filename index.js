const express = require('express')
const port = process.env.PORT || 5000;
const bodyParser = require('body-parser')
const cors = require('cors');
const fs = require('fs-extra');
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');

const app = express()
app.use(bodyParser.json()); // for parsing application/json
app.use(cors());
app.use(express.static('doctors'));
app.use(fileUpload());


    //Local Server Work Without Mongo Connections
    app.get('/', (req, res) => {
        res.send('Hello Doctor Portal Sever Site ROOT')
        })


    //Mongo DB Start
    const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ci2re.mongodb.net/doctorsPortal?retryWrites=true&w=majority`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    client.connect(err => {
    const appointmentCollection = client.db("doctorsPortal").collection("appointment");
    const doctorCollection = client.db("doctorsPortal").collection("doctors");

    // perform actions on the collection object

    //Add Appointment from here and Sending DataBase
    app.post('/addAppointment',(req, res) => {
        const appointment = req.body;
        appointmentCollection.insertOne(appointment)
        .then(result => {
            console.log('Appointment Added ', result);
            res.send(result.insertedCount > 0);
        })
    });

    //Getting Data from DataBase
    app.post('/appointmentsByDate', (req, res) => {
        const date = req.body;
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                const filter = { date: date.date }
                if (doctors.length === 0) {
                    filter.email = email;
                }
                appointmentCollection.find(filter)
                    .toArray((err, documents) => {
                        console.log(email, date.date, doctors, documents)
                        res.send(documents);
                    })
            })
    })

    //Add a Doctor
    app.post('/addADoctor', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const newImg = file.data;
        const encImg = newImg.toString('base64');
        console.log(name,email);

        const filepath = `${__dirname}/doctors/${file.name}`;

        file.mv(filepath,err => {
            if(err){
                console.log(err);
                return res.status(500).send({msg: 'Failed to upload Image'});
            }
            return res.send({name: file.name, path: `/${file.name}`})
        })
        //Inserted Image Data in MongoDB
        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };

        doctorCollection.insertOne({ name, email, image })
            .then(result => {
                res.send(result.insertedCount > 0);
            });;

    })

    //Getting Doctors Info
    app.get('/doctors', (req, res) => {
        doctorCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });
    
    //Is Doctor LoggedIn
    
    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0);
            })
    })

    });


app.listen(port, () => {
  console.log(`Doctor Portal Server ${port}`)
})