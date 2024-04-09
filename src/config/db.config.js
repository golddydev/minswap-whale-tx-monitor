require('dotenv').config();

module.exports = {
  url: `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}${process.env.MONGODB_CLUSTER_URL}`,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
};
