const approvedActivityFilter = {
  reviewStatus: {
    $in: [
      "AUTO_APPROVED",
      "COLLECTOR_APPROVED"
    ]
  }
};

module.exports = {
  approvedActivityFilter
};