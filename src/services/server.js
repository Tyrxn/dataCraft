const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { generateUploadUrl, generateDownloadUrl } = require('./s3');
const { redisClient, connection } = require('./redis'); 
const Queue = require('bull');
const path = require('path');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter'); 
const { ExpressAdapter } = require('@bull-board/express');

const PORT = 5000;
const app = express();
const queueName = "augment";
const augmentQueue = new Queue(queueName, { redis: connection });

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');
const queues = [new BullAdapter(augmentQueue)];
createBullBoard({
  queues,
  serverAdapter
});
app.use('/admin/queues', serverAdapter.getRouter());

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});


app.use(bodyParser.json({ limit: '150mb' }));
app.use(bodyParser.urlencoded({ limit: '150mb', extended: true }));
// app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});

function getMIMEType(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'tiff':
    case 'tif':
      return 'image/tiff';
    default:
      return 'image/jpeg';  
  }
}



async function storeInstructionsInRedis(jobID, instructions) {
  const instructionKey = `instruction_${jobID}.json`;
  return new Promise((resolve, reject) => {
      redisClient.set(instructionKey, JSON.stringify(instructions), (err) => {
          if (err) reject(err);
          else resolve();
      });
  });
}



app.post('/augment', async (req, res) => {
  const { jobID, instructions, images } = req.body;
  if (!jobID) {
    return res.status(400).json({ status: 'failure', message: 'Missing jobID.' });
  }

  if (!Array.isArray(images)) {
    return res.status(400).json({ status: 'failure', message: 'Images should be an array.' });
  }

  let serializedInstructions;
  try {
    serializedInstructions = JSON.stringify(instructions);
  } catch (error) {
    console.error("Serialization error:", error);
    return res.status(400).json({ status: 'failure', message: 'Non-serializable instructions provided.' });
  }

  let jobIds = [];

  try {
    await storeInstructionsInRedis(jobID, instructions);
    for (const image of images) {
      let serializedImage;
      try {
        serializedImage = JSON.stringify(image);
      } catch (error) {
        console.error("Serialization error for image:", image, error);
        continue; 
      }
  
      try {
        const job = await augmentQueue.add({
          jobID,
          serializedInstructions,
          serializedImage
        });
        jobIds.push(job.id); 
        const jobCountKey = `jobCount_${jobID}`;

        if (jobIds.length === 0) {
          await redisClient.set(jobCountKey, '1');
        } else {
          await redisClient.incr(jobCountKey);
        }
      } catch (error) {
        console.error("Error adding to queue:", error);
      }
    }
  
    return res.status(202).json({ status: 'success', message: 'Jobs accepted', jobIds: jobIds });
  } catch (err) {
    console.error("Error processing images:", err);
    return res.status(500).json({ status: 'failure', message: 'Error processing images.' });
  }
  
});


// S3 Endpoints

app.get('/download-url', async (req, res) => {
  const { key } = req.query; 

  if (!key) {
    return res.status(400).json({ status: 'failure', message: 'Key is required.' });
  }
  try {
    const downloadUrl = await generateDownloadUrl(key);
    if (!downloadUrl) {
      return res.status(500).json({ status: 'failure', message: 'Error generating download URL.' });
    }

    return res.status(200).json({ status: 'success', downloadUrl });
  } catch (err) {
    console.error("Error generating download URL:", err);
    return res.status(500).json({ status: 'failure', message: 'Error generating download URL.' });
  }
});

app.get('/upload-url', async (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return res.status(400).json({ status: 'failure', message: 'Filename is required.' });
  }

  try {
    const mimeType = getMIMEType(filename);
    const uploadUrl = await generateUploadUrl(filename, mimeType);

    if (!uploadUrl) {
      return res.status(500).json({ status: 'failure', message: 'Error generating upload URL.' });
    }

    return res.status(200).json({ status: 'success', uploadUrl });
  } catch (err) {
    console.error("Error generating upload URL:", err);
    return res.status(500).json({ status: 'failure', message: 'Error generating upload URL.' });
  }
});


// Redis Endpoints

app.get('/instructions', async (req, res) => {
  const { jobID } = req.query;

  if (!jobID) {
    return res.status(400).json({ status: 'failure', message: 'Job ID is required.' });
  }
  const instructionKey = `instruction_${jobID}.json`;

  redisClient.get(instructionKey, (err, instructions) => {
    if (err) {
      console.error("Error fetching instructions from Redis:", err);
      return res.status(500).json({ status: 'failure', message: 'Error fetching instructions.' });
    }
    if (!instructions) {
      return res.status(200).json({ status: 'success', instructions: [] });
    }
    res.status(200).json({ status: 'success', instructions: JSON.parse(instructions) });
  });
});


app.put('/instructions', async (req, res) => {
  const { jobID, instructions } = req.body;

  if (!jobID || !instructions) {
    return res.status(400).json({ status: 'failure', message: 'Job ID and instructions are required.' });
  }

  const instructionKey = `instruction_${jobID}.json`;

  redisClient.set(instructionKey, JSON.stringify(instructions), (err) => {
    if (err) {
      console.error("Error updating instructions in Redis:", err);
      return res.status(500).json({ status: 'failure', message: 'Error updating instructions.' });
    }
    res.status(200).json({ status: 'success', message: 'Instructions updated successfully.' });
  });
});

app.delete('/instructions', async (req, res) => {
  const { jobID } = req.query;

  if (!jobID) {
    return res.status(400).json({ status: 'failure', message: 'Job ID is required.' });
  }

  const instructionKey = `instruction_${jobID}.json`;

  redisClient.del(instructionKey, (err) => {
    if (err) {
      console.error("Error deleting instructions from Redis:", err);
      return res.status(500).json({ status: 'failure', message: 'Error deleting instructions.' });
    }
    res.status(200).json({ status: 'success', message: 'Instructions deleted successfully.' });
  });
});

app.post('/metadata', async (req, res) => {
  const { jobID, images } = req.body;
  try {
    for (const image of images) {
      const extension = path.extname(image.name);
      const redisKey = `original_${image.name}_${jobID}${extension}`;
      const content = JSON.stringify(image);
      await redisClient.set(redisKey, content);
    }


    res.status(200).json({ status: 'success', message: 'Image metadata saved successfully' });
  } catch (error) {
    console.error('Failed to save image metadata', error);
    res.status(500).json({ status: 'error', message: 'Failed to save image metadata' });
  }
});

app.get('/metadata/:jobID', async (req, res) => {
  const { jobID } = req.params;
  try {
    const keysPattern = `original_*_${jobID}.*`;
    const keys = await redisClient.keys(keysPattern);
    const promises = keys.map(key => redisClient.get(key));
    const results = await Promise.all(promises);
    const images = results.map(result => JSON.parse(result));
    res.status(200).json({ status: 'success', images });
  } catch (error) {
    console.error('Failed to retrieve image metadata', error);
    res.status(500).json({ status: 'error', message: 'Failed to retrieve image metadata' });
  }
});

app.get('/job-status/:jobID', async (req, res) => {
  const jobID = req.params.jobID;
  const redisKey = `status_${jobID}`;
  const jobCompletedKey = `jobCompleted_${jobID}`;

  try {
    const jobStatus = await redisClient.hgetall(redisKey);
    const jobCompleted = await redisClient.get(jobCompletedKey); 

    if (jobStatus) {
      jobStatus.processedImages = parseInt(jobStatus.processedImages, 10);
      jobStatus.totalImages = parseInt(jobStatus.totalImages, 10);

      res.json({
        status: "success",
        processedImages: jobStatus.processedImages,
        totalImages: jobStatus.totalImages,
        workerId: jobStatus.workerId,
        currentImage: jobStatus.currentImage,
        jobCompleted: jobCompleted === 'true' // Convert to boolean
      });
    } else {
      res.status(404).json({ status: "error", message: "Job status not found." });
    }
  } catch (error) {
    console.error("Error fetching job status:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});


async function updateJobCompletionStatus(jobId) {
  const completedCountKey = `completedJobsCount_${jobId}`;
  const jobCountKey = `jobCount_${jobId}`;

  const completedCount = await redisClient.incr(completedCountKey);

  const totalJobs = parseInt(await redisClient.get(jobCountKey), 10);

  if (completedCount === totalJobs) {
    console.log(`All jobs for jobID ${jobId} are completed.`);
    await redisClient.set(`jobCompleted_${jobId}`, 'true');
  }
}


augmentQueue.on('completed', async (job) => {
  // Assuming job.data.jobID holds the jobID
  await updateJobCompletionStatus(job.data.jobID);
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Bull Board is available at http://datacraftlb-536406570.ap-southeast-2.elb.amazonaws.com:${PORT}/admin/queues`);
});



module.exports = {
  getMIMEType,
  augmentQueue
};
