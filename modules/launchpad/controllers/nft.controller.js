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
const { specialCharacter } = require("../../../helpers/RegexHelper");
const { uploadDir } = require("../../../services/pinata");

const getjson = (file) => {
  const readableStreamForFile = fs.createReadStream(file.path);
  const jsonString = fs.readFileSync(appDir+"/public/files/" + file.originalname);
  const jsondata = JSON.parse(jsonString);
  return jsondata;
};

const uploadMultiJsonToPinata = async (req, res) => {
  try {
    const filename = "";

    let filedatas = getjson(req.file);
    let count = 1;
    let randomNum = (Math.random() + 1).toString(36).substring(7);
    fs.mkdir(path.join(appDir + "/public/", randomNum), (err) => {
      if (err) {
        return console.error(err);
      }
      console.log("Directory created successfully!");
    });

    let folderPath = appDir  + `/public/${randomNum}`;
    for (const data of filedatas) {
      let fileUploadPath = appDir + `/public/${randomNum}/` + count + ".json";
      fs.writeFile(fileUploadPath, JSON.stringify(data), function (err) {});
      count++;
    }

    let result = await uploadDir(folderPath);

    fs.rmSync(folderPath, { recursive: true, force: true });
    fs.rmSync(appDir + "/" + req.file.path, {
      recursive: true,
      force: true,
    });
    res
      .status(200)
      .send(new ResponseObject(200, "Uploaded successfully", result));
  } catch (error) {
    console.log("error", error)
    res
      .status(500)
      .send(new ResponseObject(500, "Something went wrong", error));
  }
};
// const createNft = async (req, res) => {
//   try {
//     const { files } = req;
//     const { collectionId } = req.body;
//     const publicdir = appDir + "/public";
//     if (!fs.existsSync(publicdir)) {
//       fs.mkdirSync(publicdir, 0744);
//     }
//     const uploaddir = appDir + "/public/nft-files";
//     if (!fs.existsSync(uploaddir)) {
//       fs.mkdirSync(uploaddir, 0744);
//     }
//     const launchPadCollection = await LaunchPadCollection.findOne({
//       _id: collectionId,
//     });
//     if (!launchPadCollection) {
//       return res
//         .status(400)
//         .send(new ResponseObject(400, "Collection not found", []));
//     }
//     const results = await fileUpload(files, true);
//     let nftDetails = [];
//     let baseArtName = launchPadCollection.baseArtName;
//     let nftDescription = launchPadCollection.nftDescription;
//     let nftCount = 1;
//     for (const image of results) {
//       nftName = baseArtName + " #" + nftCount;
//       let nftObj = {
//         name: nftName,
//         image: image.url,
//         description: nftDescription.replace("{name}", nftName),
//         mintCost: launchPadCollection.mintCost,
//         royalties: launchPadCollection.royalties,
//         status: "Active",
//         isActive: true,
//         networkId: launchPadCollection.networkId,
//         networkName: launchPadCollection.networkName,
//         owner: launchPadCollection.owner,
//         creator: launchPadCollection.creator,
//         currency: launchPadCollection.currency
//       };
//       let otherNftData = {
//         collectionId: launchPadCollection._id,
//         awsImage: image.s3Images,
//       };
//       const launchpadnft = await LaunchPadNft.findOne({
//         collectionId: launchPadCollection._id,
//         name: nftName,
//       });
//       if (launchpadnft) {
//         await LaunchPadNft.findByIdAndUpdate(
//           { _id: launchpadnft._id },
//           { ...otherNftData, ...nftObj }
//         );
//       } else {
//         await LaunchPadNft.create({ ...otherNftData, ...nftObj });
//       }
//       nftDetails.push(nftObj);
//       nftCount++;
//     }
//     const result = await uploadMultiJsonData(nftDetails);
//     fs.rmSync(uploaddir, { recursive: true, force: true });
//     if (result && result.IpfsHash) {
//       await LaunchPadCollection.findOneAndUpdate(
//         { _id: collectionId },
//         {
//           tokenURI: "https://bleufi.mypinata.cloud/ipfs/" + result.IpfsHash,
//           maxSupply: nftCount - 1,
//         },
//         {
//           new: true,
//         }
//       );
//     }
//     res
//       .status(200)
//       .send(new ResponseObject(200, "Nft create successfully", result));
//   } catch (error) {
//     res
//       .status(500)
//       .send(new ResponseObject(500, "Something went wrong", error));
//   }
// };

const getNftList = async (req, res) => {
  try {
    const { collectionId, owner, loginUserAddress } = req.body;
    let filtercolumn = [];

    req.body.collectionAddress = { $ne: null }
    filtercolumn.push("collectionAddress"); 

    if (req.body.isSale || req.body.isSale === false) {
      filtercolumn.push("isSale");
    }

    if (collectionId) {
      filtercolumn.push("collectionId");
    }
    
    if (req.body.owner) {
      filtercolumn.push("owner");
    }

   
    let isAdmin = false;
    if (loginUserAddress) {
      isAdmin = await getAdminAddress(loginUserAddress);
    }
    if (req.body.searchText) {
      let search = await specialCharacter(req.body.searchText);
      search = new RegExp(".*" + search + ".*", "i");
      req.body.$or = [{ description: search }, { name: search }];
      filtercolumn.push("$or");
    }

    if (req.body.networkId && req.body.networkName) {
      filtercolumn.push("networkId", "networkName");
    }

    if (!isAdmin && !owner) {
      req.body.isMint = true;
      filtercolumn.push("isMint");
    } else {
      if (!isAdmin) {
        console.log("error");
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
    console.log("error", error)
    res
      .status(500)
      .send(new ResponseObject(500, "Something went wrong", error));
  }
};

const getMyNftList = async (req, res) => {
  try {
    const { collectionId, owner, loginUserAddress } = req.body;

    let filtercolumn = [];
    
    req.body.collectionAddress = { $ne: null }
    filtercolumn.push("collectionAddress"); 
    req.body.creator = req.userData.account.toLowerCase();
    filtercolumn.push("creator");

    if (req.body.isSale || req.body.isSale === false) {
      filtercolumn.push("isSale");
    }
    if (collectionId) {
      filtercolumn.push("collectionId");
    }
    let isAdmin = false;
    if (loginUserAddress) {
      isAdmin = await getAdminAddress(loginUserAddress);
    }

    if (req.body.networkId && req.body.networkName) {
      filtercolumn.push("networkId", "networkName");
    }
    
    if (req.body.searchText) {
      let search = await specialCharacter(req.body.searchText);
      search = new RegExp(".*" + search + ".*", "i");
      req.body.$or = [{ description: search }, { name: search }];
      filtercolumn.push("$or");
    }
    // if (!isAdmin && !owner) {
    //   req.body.isMint = true;
    //   filtercolumn.push("isMint");
    // } else {
    //   if (!isAdmin) {
    //     console.log("error");
    //     req.body.$or = [{ isMint: true }, { owner: loginUserAddress }];
    //     filtercolumn.push("$or");
    //   }
    // }
    const filter = pick(req.body, filtercolumn);
    const options = pick(req.body, ["sortBy", "limit", "page"]);
    const result = await Nft.getLaunchPadNftList(filter, options, req);
    res
      .status(200)
      .send(new ResponseObject(200, "Get all my nfts successfully", result));
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

const getNftAttributes = async (req, res) => {
  try {
    const { collectionId, nftId } = req.body;
   
    if (!collectionId) {
      return res.status(400).send(new ResponseObject(400, "Collection id is required"));
    }
    if (!nftId) {
      return res.status(400).send(new ResponseObject(400, "NFT id is required"));
    }

    const nftsAttributes = await LaunchPadNft.findOne({_id: nftId}).select("attributes");
    if (!nftsAttributes) {
      return res.status(400).send(new ResponseObject(400, "NFT not found"));
    }
    const attributesArray = nftsAttributes.attributes
    
    let allNftsAttributes = await LaunchPadNft.find({collectionId: collectionId, isMint: true}).select("attributes");
    
    // if(isVisible == false){
    //   allNftsAttributes = await LaunchPadNft.find({collectionId: collectionId}).select("attributes");
    // }

    if(allNftsAttributes.length == 0 ){
      return res.status(400).send(new ResponseObject(400, "Data not found"));
    }
    
    const newArray = []
    for (const iterator of allNftsAttributes) {
      const attributes = iterator.attributes
      for (const iteratorNew of attributes) {
        newArray.push(iteratorNew)
      }
    }
    const result = Object.values(newArray.reduce((item, index) => {
      let key = `${index.trait_type}|${index.value}`;
      if(!item[key]) item[key] = {...index, count: 1}
      else item[key].count += 1;
      return item;
    }, {}))

    const otherResult = Object.values(newArray.reduce((item, index) => {
      let key = `${index.trait_type}`;
      if(!item[key]) item[key] = {...index, count: 1}
      else item[key].count += 1;
      return item;
    }, {}))
    
   
    let newAttributesArray = []
    for (const iterator of attributesArray) {
      let objWithCount = result.find(item => item.trait_type == iterator.trait_type);
      iterator.count = objWithCount.count
      let otherObjWithCount = otherResult.find(item => item.trait_type == iterator.trait_type);
      iterator.totalCount = otherObjWithCount.count
      iterator.percentage = objWithCount.count/otherObjWithCount.count*100
      newAttributesArray.push(iterator)
    }
    
    return res
      .status(200)
      .send(new ResponseObject(200, "Attributes display successfully", newAttributesArray));
  } catch (error) {
    console.log("error", error)
    res
      .status(500)
      .send(new ResponseObject(500, "Something went wrong", error));
  }
};

module.exports = {
  uploadMultiJsonToPinata,
  getNftAttributes,
  getNftList,
  getMyNftList,
  nftDetail,
};
