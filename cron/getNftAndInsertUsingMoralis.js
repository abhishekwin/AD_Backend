const { Nfts, CollectionNFTs, History, Users } = require("../models");
require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const { setMoralisNftData } = require("../middleware/moralisApi");
const { uploadImageOnS3 } = require("../services/fileUpload")
const { response } = require("express");

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    //logger.info('Connected to MongoDB');
  })
  .catch((e) => {
    console.log("error", e);
  });
const createNftUsingMoralises = async () => {
  let getMoralisCollectionAddress = await CollectionNFTs.findOne({
    isMoralisesDataStatus: ["pending","in-progress"],
    isMoralisesCollection: true,
  });
  
  if (getMoralisCollectionAddress) {
    const body = {
      chain: process.env.MORALIS_CHAIN,
      account: getMoralisCollectionAddress.collectionAddress,
      limit: 100,
      cursor: "",
    };
    
    await CollectionNFTs.updateOne(
      {
        _id: getMoralisCollectionAddress.id,
      },
      {
        $set: {
          isMoralisesDataStatus: "in-progress",
        },
      }
    );
    
    const getNftList = await setMoralisNftData(body);
    
    if(getNftList && getNftList.length <= 0){
      await CollectionNFTs.updateOne(
        {
          _id: getMoralisCollectionAddress.id,
        },
        {
          $set: {
            isMoralisesDataStatus: "failed",
            maxSupply: 0            
          },
        }
      );
    }
    let count = 0;
    let success = 0;
    let fail = 0;

    for (let nft of getNftList) {
      const nftData = {
        collectionAddress: nft.token_address,
        tokenId: nft.token_id,
        tokenURI: nft.token_uri,
        owner: nft.owner_of,
        creator: nft.owner_of,
        //price: parseInt(nft.amount),
        name: nft.name,
        isMoralisesNft: true,
      };
      count++;
      let user = await Users.findOne({account:nft.owner_of})
      if(!user){
        user = await Users.create({account:nft.owner_of})
      }
      try {
        if (
          !(await Nfts.findOne({
            collectionAddress: nft.token_address,
            tokenId: nft.token_id,
            tokenURI: nft.token_uri,
          }))
        ) {
          let awsObjectImage = null
          if(nft.token_uri){
            awsObjectImage = await uploadImageOnS3(nft.token_uri);
          }
          nftData.awsImage = awsObjectImage;
          nftData.awsImagesUpdated = true;
          const nftCreateData =  await Nfts.create(nftData);
          if(nftCreateData){
            await History.create({
              userId: user._id,
              oldUserId: null,
              nftId: nftCreateData._id,
              actionType: 0,
              price: nftCreateData.price,
              paymentType: nftCreateData.paymentType,
              time: new Date()
            });
          }
          success++;
        } else {
          await Nfts.findOneAndUpdate(
            {
              collectionAddress: nft.token_address,
              tokenId: nft.token_id,
            },
            {
              $set: {
                tokenURI: nft.token_uri,
                owner: nft.owner_of,
                creator: nft.owner_of,
                price: parseInt(nft.amount),
                name: nft.name,
              },
            }
          );
        }
      } catch (e) {
        fail++;
      }
    }
    try {
      const total = success + fail;
      await CollectionNFTs.updateOne(
        {
          _id: getMoralisCollectionAddress.id,
        },
        {
          $set: {
            isMoralisesDataStatus: "completed",
            maxSupply: count,
            moralisesNftSuccessAndFail: {
              success: success,
              fail: fail,
              total: total,
            },
          },
        }
      );
    } catch (e) {
      console.log("On sold error", e);
      Sentry.captureException(e);
    }
  }
};

// createNftUsingMoralises();
module.exports = {
  createNftUsingMoralises,
};
