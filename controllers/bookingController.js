exports.updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    // Database mein booking ko "Approved" ke sath sath "Paid" mark karein
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { paymentStatus: "Paid" }, // Tasalli karein ke aapke model mein ye field hai
      { new: true }
    );
    res.status(200).json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
