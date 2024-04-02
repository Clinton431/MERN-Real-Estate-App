import asyncHandler from 'express-async-handler';
import { prisma } from '../config/prismaConfig.js';
import { ClientSession } from 'mongodb';


export const createUser = asyncHandler(async(req, res) => {
    console.log("creaating a user")

    let {email} = req.body;
    const userExists = await prisma.user.findUnique({where: {email: email}})
    if(!userExists) {
        const user = await prisma.user.create({ data: req.body});
        res.send({
            message: "User registered successfully",
            user: user,
        });
    } else res.status(201).send({ message: "User already registered" })
}); 

// fucntion to book a visit to resd
 // Initialize Prisma client

export const bookVisit = asyncHandler(async (req, res) => {
  const { email, date } = req.body;
  const { id } = req.params;

  try {
    // Transaction block for atomic booking check and update
    const transaction = await prisma.$transaction(async (tx) => {
      const alreadyBooked = await tx.user.findUnique({
        where: { email },
        select: { bookedVisits: true },
      });

      if (alreadyBooked.bookedVisits.some((visit) => visit.id === id)) {
        throw new Error("This residency is already booked by you."); // Specific error message
      }

      await tx.user.update({
        where: { email: email },
        data: {
          bookedVisits: { push: { id, date } },
        },
      });

      return { message: "Your visit is booked successfully" }; // Return success message
    });

    res.send(transaction); // Send success response from transaction
  } catch (err) {
    if (err.code === "P2002") { // Handle potential unique constraint violation
      res.status(409).json({ message: "This residency is already booked by you." });
    } else {
      console.error(err); // Log the original error for debugging
      res.status(500).json({ message: "An error occurred while booking your visit" }); // Generic error message for user
    }
  }
});


//function to get all booking of a user

export const getAllBookings = asyncHandler(async (req, res) => {
    const {email} = req.body

    try {
        const bookings = await prisma.user.findUnique({
            where: {email},
            select: {bookedVisits: true}
        })
        res.status(200).send(bookings)
    }catch(err){
        throw new Error(err.message);
    }
})

// function to cancel the bookings
export const cancelBooking = asyncHandler(async (req, res) => {
    const {email} = req.body
    const {id} = req.params
    try {

        const user = await prisma.user.findUnique({
            where: {email: email},
            select: {bookedVisits: true}
        })

        const index = user.bookedVisits.findIndex((visit)=> visit.id === id)

        if(index === -1){
            res.status(404).json({message: "Booking not found"})
        } else {
            user.bookedVisits.splice(index, 1)
            await prisma.user.update({
                where: {email},
                data: {
                    bookedVisits: user.bookedVisits
                }
            })
            res.send("Booking cancelled successfully!")
        }

    } catch(err) {
        throw new Error(err.message);
    }
})

// fucntion to add a resd to favourites list of users:
export const toFav = asyncHandler(async( req, res)=> {
    const {email} = req.body;
    const {rid} = req.params

try{

    const user = await prisma.user.findUnique({
        where: {email}
    });
    if (user.favResidenciesID.includes(rid)) {
        const updatedUser = await prisma.user.update({
            where: {email},
            data: {
                favResidenciesID :{
                    set: user.favResidenciesID.filter((id)=> id !== rid)
                }
            }
        });
        res.send({message: "Remoed from favorites", user: updatedUser})
    } else {
        const updatedUser = await prisma.user.update({
            where: {email},
            data: {
                favResidenciesID: {
                    push: rid
                }
            }
        })
        res.send({message: "Updated favorites", user: updatedUser})
    } 
} catch(err) {
    throw new Error(err.message)
}
})

//function to get all favourites
export const getAllFavorites = asyncHandler(async (req, res) => {
    const {email} = req.body;
    try{
        const favResd = await prisma.user.findUnique({
            where: {email},
            select: {favResidenciesID: true}
        })
        res.status(200).send(favResd)

    }catch(err){
        throw new Error(err.message)
    }
})