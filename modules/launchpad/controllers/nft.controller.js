const httpStatus = require("http-status");
const fs = require("fs");
const pick = require("../../comman/pick");
const catchAsync = require("../../../utils/catchAsync");
const ResponseObject = require("../../../utils/ResponseObject");
const { Collection } = require("../services");
const { fileUpload, uploadMultiJsonData } = require("../../comman/fileUpload");
const { dirname } = require("path");
const appDir = dirname(require.main.filename);
const { LaunchPadNft, LaunchPadCollection } = require("../models");
const { getAdminAddress } = require("../../helpers/adminHelper");
const path = require("path");
const { Nft } = require("../services");

const createNft = async (req, res) => {
  try {
    const { files } = req;
    const { collectionId } = req.body;
    const publicdir = appDir + "/public";
    if (!fs.existsSync(publicdir)) {
      fs.mkdirSync(publicdir, 0744);
    }
    const uploaddir = appDir + "/public/nft-files";
    if (!fs.existsSync(uploaddir)) {
      fs.mkdirSync(uploaddir, 0744);
    }
    const launchPadCollection = await LaunchPadCollection.findOne({
      _id: collectionId,
    });
    if (!launchPadCollection) {
      return res
        .status(400)
        .send(new ResponseObject(400, "Collection not found", []));
    }
    const results = await fileUpload(files, true);
    let nftDetails = [];
    let baseArtName = launchPadCollection.baseArtName;
    let nftDescription = launchPadCollection.nftDescription;
    let nftCount = 1;
    for (const image of results) {
      nftName = baseArtName + " #" + nftCount;
      let nftObj = {
        name: nftName,
        image: image.url,
        description: nftDescription.replace("{name}", nftName),
        mintCost: launchPadCollection.mintCost,
        royalties: launchPadCollection.royalties,
        status: "Active",
        isActive: true,
        networkId: launchPadCollection.networkId,
        networkName: launchPadCollection.networkName,
        owner: launchPadCollection.owner,
        creator: launchPadCollection.creator,
      };
      let otherNftData = {
        collectionId: launchPadCollection._id,
        awsImage: image.s3Images,
      };
      const launchpadnft = await LaunchPadNft.findOne({
        collectionId: launchPadCollection._id,
        name: nftName,
      });
      if (launchpadnft) {
        await LaunchPadNft.findByIdAndUpdate(
          { _id: launchpadnft._id },
          { ...otherNftData, ...nftObj }
        );
      } else {
        await LaunchPadNft.create({ ...otherNftData, ...nftObj });
      }
      nftDetails.push(nftObj);
      nftCount++;
    }
    const result = await uploadMultiJsonData(nftDetails);
    fs.rmSync(uploaddir, { recursive: true, force: true });
    if (result && result.IpfsHash) {
      await LaunchPadCollection.findOneAndUpdate(
        { _id: collectionId },
        {
          tokenURI: "https://bleufi.mypinata.cloud/ipfs/" + result.IpfsHash,
          maxSupply: nftCount - 1,
        },
        {
          new: true,
        }
      );
    }
    res
      .status(200)
      .send(new ResponseObject(200, "Nft create successfully", result));
  } catch (error) {
    res
      .status(500)
      .send(new ResponseObject(500, "Something went wrong", error));
  }
};

const getNftList = async (req, res) => {
  try {
    const { collectionId, owner, loginUserAddress } = req.body;
    
    let filtercolumn = [];
    if (req.body.isSale || req.body.isSale === false) {
      filtercolumn.push("isSale");
    }
    if (collectionId) {
      filtercolumn.push("collectionId");
    }
    let isAdmin = false
    if(loginUserAddress){
      isAdmin = await getAdminAddress(loginUserAddress);
    }

    if (!isAdmin && !owner) {
      req.body.isMint = true;
      filtercolumn.push("isMint");
    } else {
      if (!isAdmin) {
        console.log("error")
        req.body.$or = [{ isMint: true }, { owner: loginUserAddress }];
        filtercolumn.push("$or");
      }
    }
    const filter = pick(req.body, filtercolumn);
    const options = pick(req.body, ["sortBy", "limit", "page"]);
    const result = await Nft.getLaunchPadNftList(filter, options, req);
    res
      .status(200)
      .send(new ResponseObject(200, "get all nft successfully", result));
  } catch (error) {
    res
      .status(500)
      .send(new ResponseObject(500, "Something went wrong", error));
  }
};
const nftDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const getNftDetail = await LaunchPadNft.findOne({ _id: id });
    if (!getNftDetail) {
      return res.status(400).send(new ResponseObject(400, "nft is not found"));
    }
    return res
      .status(200)
      .send(new ResponseObject(200, "get nft successfully", getNftDetail));
  } catch (error) {
    res
      .status(500)
      .send(new ResponseObject(500, "Something went wrong", error));
  }
};

module.exports = {
  createNft,
  getNftList,
  nftDetail,
};
