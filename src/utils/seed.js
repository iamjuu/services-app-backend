const mongoose = require('mongoose');
const User = require('../models/User');
const Category = require('../models/Category');
const ProfessionalProfile = require('../models/ProfessionalProfile');
const ProfessionalDocument = require('../models/ProfessionalDocument');
const Inquiry = require('../models/Inquiry');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const seedInitialData = async () => {
  // Check if Admin exists
  const adminExists = await User.findOne({ email: 'admin@example.com' });
  let adminUser = adminExists;

  if (!adminExists) {
    adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      phone: '+91 98765 43210',
      password: 'Admin@123',
      role: 'ADMIN',
      isActive: true,
      loginAllowed: true
    });
    console.log('[Seed]: Created Default Admin -> admin@example.com / Admin@123');
  }

  // Categories
  const defaultCategories = [
    { name: 'Plumber', description: 'Plumbing repairs, pipe installations, tap fixes and drainage solutions', icon: 'Wrench' },
    { name: 'Electrician', description: 'Wiring, switches, appliance installs and electrical inspections', icon: 'Zap' },
    { name: 'Driver', description: 'Professional personal, chauffeur and commercial vehicle driving', icon: 'Car' },
    { name: 'Alteration / Tailor', description: 'Suit tailoring, dress modifications, custom stitching and alterations', icon: 'Scissors' },
    { name: 'Carpenter', description: 'Furniture making, wood repair, cabinet making and framing', icon: 'Hammer' },
    { name: 'Painter', description: 'Interior/exterior house painting, texture design and wall putty', icon: 'Paintbrush' },
    { name: 'AC Technician', description: 'AC servicing, gas refills, compressor repair and installation', icon: 'Wind' },
    { name: 'Mechanic', description: 'Car & motorcycle troubleshooting, engine diagnostics and brake repairs', icon: 'Cog' }
  ];

  const categoryMap = {};
  for (const cat of defaultCategories) {
    let existing = await Category.findOne({ name: cat.name });
    if (!existing) {
      existing = await Category.create({ ...cat, isActive: true });
      console.log(`[Seed]: Created Category -> ${cat.name}`);
    }
    categoryMap[cat.name] = existing._id;
  }

  // Sample Approved Professional (Rahul - Plumber in Kannur)
  let rahulUser = await User.findOne({ email: 'rahul.plumber@example.com' });
  if (!rahulUser) {
    rahulUser = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul.plumber@example.com',
      phone: '+91 98950 12345',
      password: 'Password@123',
      role: 'PROFESSIONAL',
      location: 'Kannur',
      profilePhoto: '',
      isActive: true,
      loginAllowed: true
    });

    const rahulProfile = await ProfessionalProfile.create({
      userId: rahulUser._id,
      categoryId: categoryMap['Plumber'],
      fullName: 'Rahul Sharma',
      phone: '+91 98950 12345',
      email: 'rahul.plumber@example.com',
      dateOfBirth: new Date('1994-06-15'),
      address: 'Near Old Bus Stand, Kannur, Kerala 670001',
      location: 'Kannur',
      experience: 5,
      skills: ['Pipe Fitting', 'Leak Detection', 'Water Heater Repair', 'Sanitary Fittings'],
      description: 'Expert certified plumber with over 5 years of residential & commercial service experience.',
      verificationStatus: 'APPROVED',
      isActive: true
    });

    await ProfessionalDocument.create({
      professionalId: rahulProfile._id,
      documentType: 'AADHAAR',
      fileUrl: 'sample_aadhaar.pdf',
      originalFileName: 'Aadhaar_Rahul_Verified.pdf',
      mimeType: 'application/pdf',
      fileSize: 102400
    });

    console.log('[Seed]: Created Sample Approved Professional -> rahul.plumber@example.com / Password@123');
  }

  // Sample Approved Electrician (Arun - Electrician in Kochi)
  let arunUser = await User.findOne({ email: 'arun.electric@example.com' });
  if (!arunUser) {
    arunUser = await User.create({
      name: 'Arun Kumar',
      email: 'arun.electric@example.com',
      phone: '+91 98470 54321',
      password: 'Password@123',
      role: 'PROFESSIONAL',
      location: 'Kochi',
      profilePhoto: '',
      isActive: true,
      loginAllowed: true
    });

    const arunProfile = await ProfessionalProfile.create({
      userId: arunUser._id,
      categoryId: categoryMap['Electrician'],
      fullName: 'Arun Kumar',
      phone: '+91 98470 54321',
      email: 'arun.electric@example.com',
      dateOfBirth: new Date('1992-11-20'),
      address: 'MG Road, Ernakulam, Kochi 682016',
      location: 'Kochi',
      experience: 7,
      skills: ['Short Circuit Troubleshooting', 'Distribution Boards', 'Inverter Wiring', 'LED Lighting'],
      description: 'Licensed wireman with 7 years of industrial & household electrical maintenance experience.',
      verificationStatus: 'APPROVED',
      isActive: true
    });

    await ProfessionalDocument.create({
      professionalId: arunProfile._id,
      documentType: 'AADHAAR',
      fileUrl: 'sample_aadhaar_arun.pdf',
      originalFileName: 'Aadhaar_Arun_Verified.pdf',
      mimeType: 'application/pdf',
      fileSize: 104800
    });

    console.log('[Seed]: Created Sample Approved Professional -> arun.electric@example.com / Password@123');
  }

  // Sample Pending Professional (Vikram - AC Technician in Kozhikode)
  let vikramUser = await User.findOne({ email: 'vikram.ac@example.com' });
  if (!vikramUser) {
    vikramUser = await User.create({
      name: 'Vikram Nair',
      email: 'vikram.ac@example.com',
      phone: '+91 97450 99887',
      password: 'Password@123',
      role: 'PROFESSIONAL',
      location: 'Kozhikode',
      profilePhoto: '',
      isActive: false,
      loginAllowed: false
    });

    const vikramProfile = await ProfessionalProfile.create({
      userId: vikramUser._id,
      categoryId: categoryMap['AC Technician'],
      fullName: 'Vikram Nair',
      phone: '+91 97450 99887',
      email: 'vikram.ac@example.com',
      dateOfBirth: new Date('1996-03-22'),
      address: 'SM Street, Kozhikode, Kerala 673001',
      location: 'Kozhikode',
      experience: 4,
      skills: ['Split AC Maintenance', 'Gas Charging R32/R410', 'PCB Diagnostics'],
      description: 'Certified HVAC technician specializing in modern inverter AC systems and cooling efficiency.',
      verificationStatus: 'PENDING',
      isActive: false
    });

    await ProfessionalDocument.create({
      professionalId: vikramProfile._id,
      documentType: 'AADHAAR',
      fileUrl: 'sample_aadhaar_vikram.pdf',
      originalFileName: 'Aadhaar_Vikram_Pending.pdf',
      mimeType: 'application/pdf',
      fileSize: 122400
    });

    await ProfessionalDocument.create({
      professionalId: vikramProfile._id,
      documentType: 'PROFESSIONAL_CERTIFICATE',
      fileUrl: 'sample_iti_cert.pdf',
      originalFileName: 'ITI_Refrigeration_Cert.pdf',
      mimeType: 'application/pdf',
      fileSize: 204800
    });

    await Inquiry.create({
      professionalProfileId: vikramProfile._id,
      status: 'PENDING',
      notes: 'Submitted new registration with Aadhaar and ITI Refrigeration certificate.'
    });

    console.log('[Seed]: Created Sample Pending Inquiry -> vikram.ac@example.com');
  }

  // Sample Customer (Priya)
  let priyaUser = await User.findOne({ email: 'priya.customer@example.com' });
  if (!priyaUser) {
    priyaUser = await User.create({
      name: 'Priya Nambiar',
      email: 'priya.customer@example.com',
      phone: '+91 94470 11223',
      password: 'Password@123',
      role: 'CUSTOMER',
      location: 'Kannur',
      profilePhoto: '',
      isActive: true,
      loginAllowed: true
    });

    console.log('[Seed]: Created Sample Customer -> priya.customer@example.com / Password@123');

    // Create an initial sample conversation between Priya and Rahul
    const existingConv = await Conversation.findOne({
      customerId: priyaUser._id,
      professionalId: rahulUser._id
    });

    if (!existingConv) {
      const conv = await Conversation.create({
        customerId: priyaUser._id,
        professionalId: rahulUser._id,
        lastMessage: 'Sure, I can visit tomorrow morning around 10 AM.',
        lastMessageAt: new Date(Date.now() - 3600000),
        unreadCountCustomer: 1,
        unreadCountProfessional: 0
      });

      await Message.create({
        conversationId: conv._id,
        senderId: priyaUser._id,
        receiverId: rahulUser._id,
        message: 'Hi Rahul, I noticed a kitchen sink pipe leak. Are you available for a repair visit?',
        messageType: 'TEXT',
        isRead: true,
        createdAt: new Date(Date.now() - 7200000)
      });

      await Message.create({
        conversationId: conv._id,
        senderId: rahulUser._id,
        receiverId: priyaUser._id,
        message: 'Sure, I can visit tomorrow morning around 10 AM.',
        messageType: 'TEXT',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000)
      });

      console.log('[Seed]: Created sample conversation & messages between Priya and Rahul');
    }
  }
};

module.exports = {
  seedInitialData
};
