import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { User, Booking, Flight } from './schemas.js';

const app = express();

app.use(express.json());
app.use(bodyParser.json({limit: "30mb", extended: true}))
app.use(bodyParser.urlencoded({limit: "30mb", extended: true}));
app.use(cors());

// Get environment variables directly
const PORT = process.env.PORT || 6001;
const DB_URI = process.env.MONGODB_URI;

// Validate environment variables
if (!DB_URI) {
    console.error('❌ MONGODB_URI environment variable is not set');
    process.exit(1);
}

// mongoose setup
mongoose.connect(DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>{

    console.log('✅ Connected to MongoDB successfully');

    // All the client-server activites


    app.post('/register', async (req, res) => {
        const { username, email, usertype, password } = req.body;
        let approval = 'approved';
        try {
          
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: 'User already exists' });
            }

            if(usertype === 'flight-operator'){
                approval = 'not-approved'
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({
                username, email, usertype, password: hashedPassword, approval
            });
            const userCreated = await newUser.save();
            
            // Don't send password to client
            const { password: _, ...userWithoutPassword } = userCreated.toObject();
            return res.status(201).json(userWithoutPassword);

        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Server Error' });
        }
    });

    app.post('/login', async (req, res) => {
        const { email, password } = req.body;
        try {

            const user = await User.findOne({ email });
    
            if (!user) {
                return res.status(401).json({ message: 'Invalid email or password' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid email or password' });
            } else{
                // Don't send password to client
                const { password: _, ...userWithoutPassword } = user.toObject();
                return res.json(userWithoutPassword);
            }
          
        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Server Error' });
        }
    });
      

    // Approve flight operator

    app.post('/approve-operator', async(req, res)=>{
        const {id} = req.body;
        try{
            
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            user.approval = 'approved';
            await user.save();
            res.json({message: 'approved!'})
        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })

    // reject flight operator

    app.post('/reject-operator', async(req, res)=>{
        const {id} = req.body;
        try{
            
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            user.approval = 'rejected';
            await user.save();
            res.json({message: 'rejected!'})
        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })


    // fetch user

    app.get('/fetch-user/:id', async (req, res)=>{
        const id = req.params.id;
        console.log(req.params.id)
        try{
            const user = await User.findById(id).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            console.log(user);
            res.json(user);

        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })

    // fetch all users

    app.get('/fetch-users', async (req, res)=>{

        try{
            const users = await User.find().select('-password');
            res.json(users);

        }catch(err){
            console.log(err);
            res.status(500).json({message: 'error occured'});
        }
    })


    // Add flight

    app.post('/add-flight', async (req, res)=>{
        const {flightName, flightId, origin, destination, departureTime, 
                                arrivalTime, basePrice, totalSeats} = req.body;
        try{

            const flight = new Flight({flightName, flightId, origin, destination, 
                                        departureTime, arrivalTime, basePrice, totalSeats});
            await flight.save();

            res.json({message: 'flight added'});

        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })

    // update flight
    
    app.put('/update-flight', async (req, res)=>{
        const {_id, flightName, flightId, origin, destination, 
                    departureTime, arrivalTime, basePrice, totalSeats} = req.body;
        try{

            const flight = await Flight.findById(_id)
            
            if (!flight) {
                return res.status(404).json({ message: 'Flight not found' });
            }

            flight.flightName = flightName;
            flight.flightId = flightId;
            flight.origin = origin;
            flight.destination = destination;
            flight.departureTime = departureTime;
            flight.arrivalTime = arrivalTime;
            flight.basePrice = basePrice;
            flight.totalSeats = totalSeats;

            await flight.save();

            res.json({message: 'flight updated'});

        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })

    // fetch flights

    app.get('/fetch-flights', async (req, res)=>{
        
        try{
            const flights = await Flight.find();
            res.json(flights);

        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })


    // fetch flight

    app.get('/fetch-flight/:id', async (req, res)=>{
        const id = req.params.id;
        console.log(req.params.id)
        try{
            const flight = await Flight.findById(id);
            if (!flight) {
                return res.status(404).json({ message: 'Flight not found' });
            }
            console.log(flight);
            res.json(flight);

        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })

    // fetch all bookings

    app.get('/fetch-bookings', async (req, res)=>{
        
        try{
            const bookings = await Booking.find();
            res.json(bookings);

        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })

    // Book ticket

    app.post('/book-ticket', async (req, res)=>{
        const {user, flight, flightName, flightId,  departure, destination, 
                    email, mobile, passengers, totalPrice, journeyDate, journeyTime, seatClass} = req.body;
        try{
            const bookings = await Booking.find({flight: flight, journeyDate: journeyDate, seatClass: seatClass});
            const numBookedSeats = bookings.reduce((acc, booking) => acc + booking.passengers.length, 0);
            
            let seats = "";
            const seatCode = {'economy': 'E', 'premium-economy': 'P', 'business': 'B', 'first-class': 'A'};
            let coach = seatCode[seatClass];
            for(let i = numBookedSeats + 1; i< numBookedSeats + passengers.length+1; i++){
                if(seats === ""){
                    seats = seats.concat(coach, '-', i);
                }else{
                    seats = seats.concat(", ", coach, '-', i);
                }
            }
            const booking = new Booking({user, flight, flightName, flightId, departure, destination, 
                                            email, mobile, passengers, totalPrice, journeyDate, journeyTime, seatClass, seats});
            await booking.save();

            res.json({message: 'Booking successful!!'});
        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })


    // cancel ticket

    app.put('/cancel-ticket/:id', async (req, res)=>{
        const id = req.params.id;
        try{
            const booking = await Booking.findById(id);
            if (!booking) {
                return res.status(404).json({ message: 'Booking not found' });
            }
            booking.bookingStatus = 'cancelled';
            await booking.save();
            res.json({message: "booking cancelled"});

        }catch(err){
            console.log(err);
            res.status(500).json({ message: 'Server Error' });
        }
    })


    app.listen(PORT, ()=>{
        console.log(`✅ Server running on port ${PORT}`);
    });

}).catch((e)=> {
    console.error(`❌ Error in db connection: ${e}`);
    process.exit(1);
});
