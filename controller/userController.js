const User = require('../model/user');
const db = require('../config/db.js');
const Books = require('../model/books');
const mongoose = require('mongoose');
const UserBook = require('../model/userBook');


exports.getAllBooks = async(req,res)=>{
    try{
        if(!req.session.user){
            return res.send("First Enter your login credential to access to all books");
        }
        if(req.session.user.isAdmin==false){
            return res.send("Only Admins can access to all books");
        }
        const books = await Books.find({}).exec();
        res.render('all-books',{
            books_list:books
        });
    }
    catch(err){
        
    }
}

exports.getPage = async(req,res)=>{
    try{
        res.render('user',{

        })
    }
    catch(err){
        
    }
}
exports.getLogin = async(req,res)=>{
    try{
        res.render('login',{

        });
        
    }
    catch(err){
        
    }
}
exports.getAddBook = async(req,res)=>{
    try{
        if(!req.session.user){
            return res.send("First Enter your login credential to access to adding books");
        }
        if(req.session.user.isAdmin==false){
            return res.send("Only Admins can access to these page");
        }
        res.render('addBook',{
            
        })
    }
    catch(err){

    }
}
// const bcrypt = require('bcrypt');
exports.verifyLogin = async(req,res)=>{
    try{
        const {email,password} = req.body;
        const existingEmail = await User.findOne({email});
        
        // if(!(existingEmail.password == password) || !existingEmail){
        //     return res.status(401).json({error:'Invalid email and password'});
        // }
        if (!existingEmail) {
            return res.status(401).json({ error: 'User does not exist.' });
          }
      
          const isPasswordValid = await existingEmail.comparePassword(password);
          if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email and password' });
          }
    
        req.session.user = existingEmail;
        // const passwordMatch = await bcrypt.compare(password,existingUser.password);
        return res.redirect('/profile');
    }
    catch(err){
        console.error('Error in verifying login:', err);
        return res.redirect('/login');
    }
}
exports.createUser = async(req,res)=>{
    try{
        const {name,password,email,userid} = req.body;
        const existingEmail = await User.findOne({email})
            if(existingEmail){
                return res.send("Error email id is already present");
            }
        const userCreated = await User.create({name,password,email,userid});
        console.log('User Registered Successfully',userCreated);

        //creating user specific book collection
        function generateUserCollectionName(userid){
            return `books_${userid}`;
        }
        async function createUserCollection(userid){
            const userCollectionName = generateUserCollectionName(userid);
            try{
                await mongoose.connection.createCollection(userCollectionName);
                console.log(`User collection "${userCollectionName}" created successfully`);
            }catch(err){
                console.log(`Error in creating user collection: ${error}`);
            }
        }
        createUserCollection(userid);

        return res.redirect('/login');
        
    }
    catch(err){
        console.log('error in creating a new user',err);
        return res.redirect('back');
    }
}

exports.getProfile = async (req, res) => {
    try {
        // Check if the user is logged in
        if (!req.session.user) {
            return res.redirect('/login');
        }

        console.log("testing",req.session.user);
        // Render the user profile page with user details
        
        res.render('profile', { user_details: req.session.user });
    } catch (err) {
        console.error('Error in loading profile:', err);
        res.redirect('/login');
    }
}

//Adding Book code  
exports.addBook = async(req,res)=>{
    try{
        const {title,author,isbn,price,quantity} = req.body;
        const bookAdded = await Books.create({title,author,isbn,price,quantity});
        console.log("Book is added",bookAdded);
        return res.redirect('back');
        res.render('addBook',{

        })
    }
    catch(err){

    }
}

//books displaying code
exports.getBooks = async(req,res)=>{
    try{
        const books = await Books.find({}).exec();
        res.render('getBook',{
            books_list:books
        });
    }
    catch(err){

    }
}

//delete book
exports.deleteBook = async(req,res)=>{
    try{
        let id = req.query.id;
        const deleted = await Books.findByIdAndDelete(id);
        console.log('Contact Deleted',deleted);
        return res.redirect('back');
    }
    catch(err){
        console.log('error in deleting the book');
        return res.redirect('back');
    }
}

//get Search book
exports.getSearchBook = async(req,res)=>{
    try{
        const query = res.query.query;

        const searchResults = books_list.filter((book)=>{
            return (
                book.title.toLowerCase().includes(query.toLowerCase()) || book.author.toLowerCase().includes(query.toLowerCase())
            );
        });

        res.render('search-results',{results:searchResults});
    }
    catch(err){

    }
}

//addtocart logic
exports.addToCart = async(req,res)=>{
    try{

        const {book_data,quantity} = req.body;
        const bookData = JSON.parse(book_data);
        console.log(bookData);
        if(quantity>bookData.quantity){
            return res.status(401).json({error:'Entered quantity is more than available'});
        }
        bookData.quantity = quantity;
        if(!req.session.user){
            return res.status(401).json({error:'User is not logged in'});
        }
        function generateUserCollectionName(userid){
            return `books_${userid}`;
        }
        // console.log(req.session.user.userid);
        const userCollectionName = generateUserCollectionName(req.session.user.userid);
        console.log(userCollectionName);
        
        // create a mongoose model for the user's book collection
        const UserBooks = mongoose.model(userCollectionName, UserBook.schema);

        //existing book check
        const existingBook = await UserBooks.findOne({isbn: bookData.isbn});
        if(existingBook){
            return res.status(400).json({error:'This book is already in your cart'});
        }

        // insert the book data into the user's collection
        const newBook = new UserBooks(bookData);
        await newBook.save();

        console.log(`Book added to user collection "${userCollectionName} successfully.`);
        return res.redirect('back');

    }catch(err){
        console.error('Error in adding book to user collection:', err);
        // Handle the error appropriately
        return res.redirect('back');
    }
}

exports.getMyCart = async(req,res)=>{
    try{
        if(!req.session.user){
            return res.status(401).json({error:'User is not logged in'});
        }
        function generateUserCollectionName(userid){
            return `books_${userid}`;
        }
        // console.log(req.session.user.userid);
        const userCollectionName = generateUserCollectionName(req.session.user.userid);
        console.log(userCollectionName);

        //user specific books
        const UserBooks = mongoose.model(userCollectionName,UserBook.schema);

        const books = await UserBooks.find({}).exec();
        res.render('cart',{
            book_list:books
        });
        
    }
    catch(err){

    }
}

exports.deleteCartBook = async(req,res)=>{
    try{
        let id = req.query.id;
        function generateUserCollectionName(userid){
            return `books_${userid}`;
        }
        // console.log(req.session.user.userid);
        const userCollectionName = generateUserCollectionName(req.session.user.userid);
        console.log(userCollectionName);

        //user specific books
        const UserBooks = mongoose.model(userCollectionName,UserBook.schema);

        const deleted = await UserBooks.findByIdAndDelete(id);
        console.log('Contact Deleted',deleted);
        return res.redirect('back');
    }
    catch(err){
        console.log('error in deleting the book');
        return res.redirect('back');
    }
}

//admin login
exports.verifyAdminLogin = async(req,res)=>{
    try{
        const {email,password} = req.body;
        const existingEmail = await User.findOne({email});
        
        if(!existingEmail || (existingEmail.isAdmin==false)){
            return res.status(401).json({error:'Invalid email and password'});
        }

        const isPasswordValid = await existingEmail.comparePassword(password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Invalid email and password' });
        }
  

        req.session.user = existingEmail;
        // const passwordMatch = await bcrypt.compare(password,existingUser.password);
        return res.redirect('/admin-profile');
    }
    catch(err){
        console.error('Error in verifying login:', err);
        return res.redirect('/admin-login');
    }
}

exports.adminLogin = async(req,res)=>{
    try{
        return res.render('admin',{

        });
    }
    catch(err){

    }
}

exports.getAdminProfile = async(req,res)=>{
    try{
    if (!req.session.user) {
        return res.redirect('/admin-login');
    }

    console.log("testing",req.session.user);
    // Render the user profile page with user details
    
    res.render('adminProfile', { user_details: req.session.user });
    }
    catch (err) {
    console.error('Error in loading admin profile:', err);
    res.redirect('/admin-login');
}
}