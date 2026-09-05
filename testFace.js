const {
    getFaceEmbedding
} = require('./services/faceVerificationService');

const imagePath = './uploads/test-face.jpg';

async function test() {
    try {
        console.log('Testing face verification...');

        const result = await getFaceEmbedding(imagePath);

        console.log('Face detected successfully!');
        console.log('Confidence:', result.faceConfidence);
        console.log('Embedding length:', result.embedding.length);

    } catch (error) {
        console.error('Face verification test failed:');
        console.error(error.message);
    }
}

test();