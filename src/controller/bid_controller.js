const axios = require("axios");
const { createAuctionService } = require("../services/bid_service");
const { parse } = require("dotenv");
  


exports.createAcution = async (req, res) =>{
    try {
           const {
        bookKey,
        startPrice,
        durationMinutes
    } = req.body;
   
    if(bookKey != null || startPrice != null || durationMinutes != null 
        & startPrice > 0 & durationMinutes >0)
    {
        return res.status(400).json({message: "Empty field or the number does not exceed over zero"});
    }
    const bookRes = await axios.get(
          `${process.env.OPEN_LIBRARY_API_URL}${bookKey}.json`
    );
    const book = bookRes.data;

    if (!book || !book.title) {
      return res.status(404).json({ message: "Book not found" });

    }

    const snapShot = {
           title: book.title,
      description:
        typeof book.description === "string"
          ? book.description
          : book.description?.value || "",
      covers: book.covers || [],
      subjects: book.subjects || [],
    }

  const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + durationMinutes * 60000
    );

    const auction = await createAuctionService({
         sellerId,
      bookKey,
      snapshot,
      startPrice,
      startTime,
      endTime,
    });

    return res.status(201).json({
        message: "Auction created successfully",
      auction,
    })
    
    } catch (error) {
        console.log("Create auction error:", error);
        return res.status(500).json({
            message: "Internal error"
        })
    }
}

exports.getAuctionById = async (req, res) => {
  try {
    const auctionId = req.params.id;

  
    const result = await auctionService.getAuctionById(auctionId);

    
    if (!result || !result.auction) {
      return res.status(404).json({
        message: "Auction not found",
      });
    }

    const { auction, highestBid } = result;

   
    let bookSnapshot = null;

    if (auction.book_snapshot) {
      bookSnapshot = JSON.parse(auction.book_snapshot);
    }

   
    const now = Date.now();
    const endTime = new Date(auction.end_time).getTime();

    const remainingTime = endTime - now > 0 
      ? endTime - now 
      : 0;

  
    return res.status(200).json({
      auction: {
        id: auction.id,
        status: auction.status,
        startPrice: auction.start_price,
        currentPrice: auction.current_price,
        endTime: auction.end_time,
      },
      book: bookSnapshot,
      highestBid: highestBid || null,
      remainingTime,
    });


  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};


exports.getAllActiveAcutions = async (req,res) =>{
    
  try {
    const sort = req.query.sort || "endingSoon";

    const auction = await createAuctionService.getAllActiveAcutions({
        sort,
    });
    if(!auction || auctions.lengtth ==0)
    {
         return res.status(200).json({
            message: "No active auctions",
            data: [],
         });

    const formatted = auction.map((auction) =>{
        const endingSoon = new Date(auction.end_time).getTime();
        const now = Date.now();

        return {
            id: auction.id,
            currentPrice: auction.current_price,
            endTime: auction.end_time,
            remainingTime: endingSoon - now >0 ? endingSoon - now : 0,
            book: auction.book_snapshot ? JSON.parse(auction.book_snapshot) : null,

              
        };
    })
      return res.status(200).json({
        total: formatted.length,
        data: formatted,

      });

    
    }
    
  } catch (error) {
        return res.status(400).json({
            message: error.message
        })
  }


}

exports.placeBid = async (req, res) => {
  try {

    const auctionId = req.params.id;
    const { bidAmount } = req.body;
    const userId = req.user.userId; 

    if (!bidAmount || bidAmount <= 0) {
      return res.status(400).json({
        message: "Bid amount must be greater than zero",
      });
    }


    const result = await auctionService.placeBid({
      auctionId,
      userId,
      bidAmount,
    });



    return res.status(200).json({
      message: "Bid placed successfully",
      data: result,
    });

  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
