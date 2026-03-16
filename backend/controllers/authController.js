import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Register
export const registerUser = async (req,res) => {

  try {

    const {name,email,password,role} = req.body;

    const hashedPassword = await bcrypt.hash(password,10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

    res.json({message:"User registered"});

  } catch(error){
    res.status(500).json({message:error.message});
  }

};


// Login
export const loginUser = async (req,res) => {

  try{

    const {email,password} = req.body;

    const user = await User.findOne({email});

    if(!user){
      return res.status(400).json({message:"User not found"});
    }

    const isMatch = await bcrypt.compare(password,user.password);

    if(!isMatch){
      return res.status(400).json({message:"Invalid password"});
    }

    const token = jwt.sign(
      {id:user._id,role:user.role},
      "SECRET_KEY",
      {expiresIn:"1d"}
    );

    res.json({
      token,
      role: user.role,
      name: user.name
    });

  }catch(error){
    res.status(500).json({message:error.message});
  }

};