const {redisClient, connection} = require('./redis');
const Queue = require('bull');
const sharp = require('sharp');
const axios = require('axios');
const { generateUploadUrl, generateDownloadUrl} = require('./s3');
const {getMIMEType, augmentQueue} = require('./server')
const os = require('os');
const process = require('process');
const {Worker} = require('bullmq');

const generateWorkerId = () => {
  const hostname = os.hostname();
  const pid = process.pid;
  return `${hostname}-${pid}`;
}
console.log("wokrer is called");
const workerId = generateWorkerId();

async function processImage(instructions, image, jobID){
    console.log("processing an image ");
    const rotationInstruction = instructions.find(instruction => instruction.includes('Rotation Angle:'));
    const angle = rotationInstruction ? parseInt(rotationInstruction.split(': ')[1], 10) : null;
  
    const shouldFlip = instructions.some(instruction => instruction.includes('Flip Image:'));
  
    const gammaInstruction = instructions.find(instruction => instruction.includes('Correction Factor:'));
    const factor = gammaInstruction ? parseFloat(gammaInstruction.split(': ')[1], 10) : null; 
  
    const normalisationLowerInstruction = instructions.find(instruction => instruction.includes('Normalisation Lower:'));
    const normalLower = normalisationLowerInstruction ? parseInt(normalisationLowerInstruction.split(': ')[1], 10) : null; 
  
    const normalisationUpperInstruction = instructions.find(instruction => instruction.includes('Normalisation Upper:'));
    const normalUpper = normalisationUpperInstruction ? parseInt(normalisationUpperInstruction.split(': ')[1], 10) : null; 
  
    const blurInstruction = instructions.find(instruction => instruction.includes('Blur Degree:'));
    const degree = blurInstruction ? parseFloat(blurInstruction.split(': ')[1], 10) : null; 
    
    const shouldflop = instructions.some(instruction => instruction.includes('Flop Image:'));
  
    // Composite Images
    const overlayImageInstruction = instructions.find(instruction => instruction.startsWith('Overlay Image:'));
    const overlayImageName = overlayImageInstruction ? overlayImageInstruction.split(': ')[1] : null;
  
    const overlayTextInstruction = instructions.find(instruction => instruction.startsWith('Overlay Text:'));
    const overlayText = overlayTextInstruction ? overlayTextInstruction.split(': ')[1] : null;
  
    // Colour Manipulation
    const tintRedInstruction = instructions.find(instruction => instruction.startsWith('Tint Red:'));
    const tintRed = tintRedInstruction ? parseInt(tintRedInstruction.split(': ')[1], 10) : null;
  
    const tintGreenInstruction = instructions.find(instruction => instruction.startsWith('Tint Green:'));
    const tintGreen = tintGreenInstruction ? parseInt(tintGreenInstruction.split(': ')[1], 10) : null;
  
    const tintBlueInstruction = instructions.find(instruction => instruction.startsWith('Tint Blue:'));
    const tintBlue = tintBlueInstruction ? parseInt(tintBlueInstruction.split(': ')[1], 10) : null;
  
    const greyscaleInstruction = instructions.some(instruction => instruction.includes('Greyscale Image:'));
  
    // Resize Images
    const resizeWidthInstruction = instructions.find(instruction => instruction.includes("Resize Width:"))
    const resizeWidth = resizeWidthInstruction ? parseInt(resizeWidthInstruction.split(': ')[1] ,10): null;
  
    const resizeHeightInstruction = instructions.find(instruction => instruction.includes("Resize Height:"))
    const resizeHeight = resizeHeightInstruction ? parseInt(resizeHeightInstruction.split(': ')[1] ,10): null;
  
    const extendWidthInstruction = instructions.find(instruction => instruction.includes("Extend Width:"))
    const extendWidth = extendWidthInstruction ? parseInt(extendWidthInstruction.split(': ')[1] ,10): null;
  
    const extendHeightInstruction = instructions.find(instruction => instruction.includes("Extend Height:"))
    const extendHeight = extendHeightInstruction ? parseInt(extendHeightInstruction.split(': ')[1] ,10): null;
  
    const leftOffsetInstruction = instructions.find(instruction => instruction.includes("Left Offset:"))
    const leftOffset = leftOffsetInstruction ? parseInt(leftOffsetInstruction.split(': ')[1] ,10): null;
  
    const topOffsetInstruction = instructions.find(instruction => instruction.includes("Top Offset:"))
    const topOffset = topOffsetInstruction ? parseInt(topOffsetInstruction.split(': ')[1] ,10): null;
  
    const widthExtractInstruction = instructions.find(instruction => instruction.includes("Width Extract:"))
    const widthExtract = widthExtractInstruction ? parseInt(widthExtractInstruction.split(': ')[1] ,10): null;
  
    const heightExtractInstruction = instructions.find(instruction => instruction.includes("Height Extract:"))
    const heightExtract = heightExtractInstruction ? parseInt(heightExtractInstruction.split(': ')[1] ,10): null;
  
    const backgroundColourInstruction = instructions.find(instruction => instruction.includes("Background Colour:"))
    const backgroundColour = backgroundColourInstruction ? parseInt(backgroundColourInstruction.split(': ')[1] ,10): null;
  
    const thresholdInstruction = instructions.find(instruction => instruction.includes("Threshold:"))
    const threshold = thresholdInstruction ? parseInt(thresholdInstruction.split(': ')[1] ,10): null;
  
    const imageExtension = image.split('.').pop();
    const imageKey = `original_${image}_${jobID}.${imageExtension}`;
    const downloadUrl = await generateDownloadUrl(imageKey);
  
    if (!downloadUrl) {
        throw new Error('Error generating download URL for image.');
    }
  
    let imageBuffer;
    try {
        const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data, 'binary');
    } catch (err) {
        throw new Error('Error fetching the image from S3: ' + err.message);
    }
  
    let sharpImage = sharp(imageBuffer);
  
    if (shouldFlip === true) {
      sharpImage = sharpImage.flip();
    }
  
    if (gammaInstruction) {
        sharpImage = sharpImage.gamma(factor);
    }
  
    if (normalLower && normalUpper) {
        sharpImage = sharpImage.normalise({lower: normalLower, upper: normalUpper});
    }
  
    if (blurInstruction) {
        sharpImage = sharpImage.blur(degree);
    }
  
    if (shouldflop === true) {
        sharpImage = sharpImage.flop();
    }
  

    if (overlayText) {
      sharpImage = sharpImage.composite([{
          input: {
              text: {
                  text: overlayText,
                  dpi: 1500,  
                  font: 'Arial', 
              }
            },
            gravity: 'center'
        }]);
    }
  
    // Tint Images
    if (tintRed !== null || tintGreen !== null || tintBlue !== null) {
      sharpImage = sharpImage.tint({ r: tintRed, g: tintGreen, b: tintBlue });
    }
  
    // Greyscale Images
    if (greyscaleInstruction === true) {
        sharpImage = sharpImage.grayscale();
    }
  
    // Resize Images
    if (resizeWidth && resizeHeight) {
      sharpImage = sharpImage.resize(resizeWidth, resizeHeight);
    }
  
    if (extendWidth && extendHeight) {
      sharpImage = sharpImage.extend({ top: extendHeight, bottom: extendHeight, left: extendWidth, right: extendWidth });
    }
  
    if (leftOffset && topOffset && widthExtract && heightExtract) {
      sharpImage = sharpImage.extract({ left: leftOffset, top: topOffset, width: widthExtract, height: heightExtract })
    }
  
    if (backgroundColour && threshold) {
      sharpImage = sharpImage.trim({ background:  backgroundColour, threshold: threshold })
    }
    return await sharpImage.rotate(angle).toBuffer();
  }

  function publishJobUpdate(eventType, jobID, data) {
    const message = JSON.stringify({ eventType, jobID, data });
    redisClient.publish('job_updates', message);
  }

  augmentQueue.process(async (job, done) => {
    console.log('Starting job', { jobID: job.id });
  
    const { jobID, serializedInstructions, serializedImage,  } = job.data;
    const instructions = JSON.parse(serializedInstructions);
    const image = JSON.parse(serializedImage); 
  
    try {
      const outputBuffer = await processImage(instructions, image, jobID);
  
      const processedImageKey = `processed_${image}_${jobID}.${getExtension(image)}`;
      const presignedUrl = await generateUploadUrl(processedImageKey, getMIMEType(image));
  
      if (!presignedUrl) {
        throw new Error('Error generating a pre-signed URL.');
      }
  
      await axios.put(presignedUrl, outputBuffer, {
        headers: {
          'Content-Type': getMIMEType(image)
        }
      });
  
      publishJobUpdate('completed', jobID, { url: presignedUrl });
      done(null, { status: 'success', url: presignedUrl });
  
    } catch (error) {
      console.error(error.message);
      publishJobUpdate('failed', jobID, { error: error.message });
      done(new Error(error.message));
    }
  });
  
  

  function getExtension(filename) {
    return filename.split('.').pop();
  }