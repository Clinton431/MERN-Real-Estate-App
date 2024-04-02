import asyncHandler from "express-async-handler";
import { prisma } from "../config/prismaConfig.js";

export const createResidency = asyncHandler(async (req, res) => {
  // 1. Input Validation (Optional, but recommended)
  const requiredFields = ["title", "description", "price", "address", "country", "city", "userEmail"];
  const missingFields = requiredFields.filter((field) => !req.body.data[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  // 2. User Verification (Optional, but enhances security)
  const user = await prisma.user.findUnique({
    where: { email: req.body.data.userEmail },
  });

  if (!user) {
    throw new Error("User with provided email not found");
  }

  // 3. Residency Creation
  try {
    const residency = await prisma.residency.create({
      data: {
        title: req.body.data.title,
        description: req.body.data.description,
        price: req.body.data.price,
        address: req.body.data.address,
        country: req.body.data.country,
        city: req.body.data.city,
        facilities: req.body.data.facilities, // Assuming facilities is an array or object
        image: req.body.data.image,
        owner: { connect: { id: user.id } }, // Connect to verified user
      },
    });
    res.send({ message: "Residency created successfully", residency });
  } catch (err) {
    if (err.code === "P2002") {
      throw new Error("A residency with that address already exists");
    } else {
      console.error(err); // Log the original error for debugging
      throw new Error("An error occurred while creating residency"); // Generic error message for the user
    }
  }
});


// function to get all the documents/residencies
export const getAllResidencies = asyncHandler(async(req, res)=> {
    const residencies = await prisma.residency.findMany({
        orderBy: {
            createdAt: "desc",
        },
    });
    res.send(residencies)
});

// function to get specific document/ residency

export const getResidency = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const residency = await prisma.residency.findUnique({
      where: { id },
    });

    if (!residency) {
      // Residency not found
      return res.status(404).send({ message: "Residency not found" });
    }

    res.send(residency);
  } catch (err) {
    // Handle other errors (e.g., database errors)
    console.error(err); // Log the error for debugging
    return res.status(500).send({ message: "An error occurred" });
  }
});