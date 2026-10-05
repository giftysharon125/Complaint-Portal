/**
 * Seed script — loads demo data into MongoDB.
 *
 *   Usage:  npm run seed
 *
 * Creates: 1 admin, 2 staff, 5 students, 12 categories,
 * ~15 complaints across all statuses, status history and feedback.
 *
 * NOTE: this script CLEARS the collections before inserting demo data.
 * Do not run it against a database holding real data.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Category = require('../models/Category');
const ComplaintStatusHistory = require('../models/ComplaintStatusHistory');
const Feedback = require('../models/Feedback');
const Counter = require('../models/Counter');

const daysAgo = (d, h = 10) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, 0, 0, 0);
  return t;
};

const seed = async () => {
  await connectDB();

  console.log('Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Complaint.deleteMany({}),
    Category.deleteMany({}),
    ComplaintStatusHistory.deleteMany({}),
    Feedback.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  // ---------- Users ----------
  console.log('Creating users...');
  const admin = await User.create({
    name: 'Dr. Anil Deshmukh',
    email: 'admin@college.edu',
    password: 'admin123',
    department: 'Administration',
    role: 'admin',
    createdAt: daysAgo(90),
  });

  const staff1 = await User.create({
    name: 'Ramesh Kumar',
    email: 'staff1@college.edu',
    password: 'staff123',
    department: 'Maintenance & Facilities',
    role: 'staff',
    createdAt: daysAgo(90),
  });

  const staff2 = await User.create({
    name: 'Sunita Sharma',
    email: 'staff2@college.edu',
    password: 'staff123',
    department: 'IT Support',
    role: 'staff',
    createdAt: daysAgo(90),
  });

  const studentsData = [
    { name: 'Arjun Patel', studentId: 'CS2026001', email: 'arjun@college.edu', department: 'Computer Science', year: '3rd Year' },
    { name: 'Priya Singh', studentId: 'IT2026002', email: 'priya@college.edu', department: 'Information Technology', year: '2nd Year' },
    { name: 'Rahul Verma', studentId: 'EC2026003', email: 'rahul@college.edu', department: 'Electronics & Communication', year: '4th Year' },
    { name: 'Sneha Reddy', studentId: 'ME2026004', email: 'sneha@college.edu', department: 'Mechanical Engineering', year: '1st Year' },
    { name: 'Karan Mehta', studentId: 'CE2026005', email: 'karan@college.edu', department: 'Civil Engineering', year: '3rd Year' },
  ];
  const students = [];
  for (let i = 0; i < studentsData.length; i++) {
    students.push(
      await User.create({
        ...studentsData[i],
        password: 'student123',
        role: 'student',
        createdAt: daysAgo(60 - i),
      })
    );
  }

  // ---------- Categories ----------
  console.log('Creating categories...');
  const categoriesData = [
    ['Classroom', 'Issues related to classrooms, benches, blackboards and projectors'],
    ['Laboratory', 'Lab equipment, computers, software and safety issues'],
    ['Library', 'Library seating, books, issue/return and reading room issues'],
    ['Hostel', 'Hostel rooms, mess, laundry and common area issues'],
    ['Canteen', 'Food quality, hygiene, pricing and seating issues'],
    ['Transport', 'College buses, routes, timings and driver behaviour'],
    ['Infrastructure', 'Buildings, lifts, roads, parking and general facilities'],
    ['Electricity', 'Power outages, fans, lights and electrical safety'],
    ['Water', 'Drinking water supply, coolers and water logging'],
    ['Internet/Wi-Fi', 'Wi-Fi coverage, speed and network access issues'],
    ['Cleaning', 'Housekeeping, waste management and sanitation'],
    ['Other', 'Anything that does not fit the categories above'],
  ];
  const categories = {};
  for (const [name, description] of categoriesData) {
    const c = await Category.create({ name, description });
    categories[name] = c;
  }

  // ---------- Complaints ----------
  console.log('Creating complaints...');
  let seq = 0;
  const nextId = async (year) => `CMP-${year}-${String(++seq).padStart(4, '0')}`;

  const mkHistory = (complaint, steps) =>
    ComplaintStatusHistory.insertMany(
      steps.map(([status, note, changedBy, changedAt]) => ({
        complaint: complaint._id,
        status,
        changedBy,
        note,
        changedAt,
      }))
    );

  // 1. Resolved + feedback (Arjun — Wi-Fi in CSE block)
  let c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[0],
    title: 'Wi-Fi keeps disconnecting in CSE block lab 204',
    category: categories['Internet/Wi-Fi']._id,
    description:
      'The Wi-Fi access point in lab 204 drops the connection every few minutes. Online coding sessions get interrupted repeatedly during lab hours.',
    location: 'CSE Block, Lab 204',
    priority: 'High',
    status: 'Resolved',
    assignedStaff: staff2._id,
    resolutionNotes:
      'Replaced the faulty access point and reconfigured channel settings. Verified stable connectivity for a full lab session.',
    createdAt: daysAgo(18),
    updatedAt: daysAgo(14, 16),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[0], daysAgo(18)],
    ['Under Review', 'Complaint received and verified', admin, daysAgo(17)],
    ['Assigned', 'Assigned to Sunita Sharma (IT Support)', admin, daysAgo(16)],
    ['In Progress', 'Investigating access point logs', staff2, daysAgo(15)],
    ['Resolved', 'Access point replaced and verified', staff2, daysAgo(14, 16)],
  ]);
  await Feedback.create({
    complaint: c._id,
    student: students[0],
    rating: 5,
    comment: 'Fixed within days, the network is stable now. Great support!',
    createdAt: daysAgo(13),
  });

  // 2. Resolved + feedback (Priya — canteen hygiene), then closed
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[1],
    title: 'Poor hygiene near canteen washing area',
    category: categories['Canteen']._id,
    description:
      'The washing area of the main canteen has an overflowing drain with a strong smell. It is unhygienic for everyone eating there.',
    location: 'Main Canteen',
    priority: 'Critical',
    status: 'Closed',
    assignedStaff: staff1._id,
    resolutionNotes:
      'Drain cleared and covered. Cleaning contractor instructed to sanitize the area daily.',
    createdAt: daysAgo(25),
    updatedAt: daysAgo(20, 12),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[1], daysAgo(25)],
    ['Under Review', 'Marked as Critical, inspected same day', admin, daysAgo(24)],
    ['Assigned', 'Assigned to Ramesh Kumar (Maintenance)', admin, daysAgo(23)],
    ['In Progress', 'Drain cleaning arranged with contractor', staff1, daysAgo(22)],
    ['Resolved', 'Drain cleared and sanitized', staff1, daysAgo(21)],
    ['Closed', 'Closed by admin after verification', admin, daysAgo(20, 12)],
  ]);
  await Feedback.create({
    complaint: c._id,
    student: students[1],
    rating: 4,
    comment: 'Resolved quickly, but it took two reminders before it was fully fixed.',
    createdAt: daysAgo(20, 15),
  });

  // 3. Resolved + feedback (Rahul — lab projector)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[2],
    title: 'Projector not working in EC seminar hall',
    category: categories['Laboratory']._id,
    description:
      'The projector in the EC seminar hall does not power on. Guest lectures and project demos are getting affected.',
    location: 'EC Block, Seminar Hall',
    priority: 'Medium',
    status: 'Resolved',
    assignedStaff: staff2._id,
    resolutionNotes: 'Lamp replaced and projector tested with a full lecture.',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(9, 15),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[2], daysAgo(12)],
    ['Under Review', 'Under review', admin, daysAgo(11)],
    ['Assigned', 'Assigned to Sunita Sharma (IT Support)', admin, daysAgo(10)],
    ['In Progress', 'Lamp ordered and replaced', staff2, daysAgo(10, 14)],
    ['Resolved', 'Projector working normally', staff2, daysAgo(9, 15)],
  ]);
  await Feedback.create({
    complaint: c._id,
    student: students[2],
    rating: 4,
    comment: 'Good and fast work.',
    createdAt: daysAgo(8),
  });

  // 4. In progress (Sneha — hostel water)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[3],
    title: 'No water supply in hostel block B second floor',
    category: categories['Water']._id,
    description:
      'There has been no water in the second floor washrooms of hostel block B since yesterday morning. Around 40 students are affected.',
    location: 'Hostel Block B, 2nd Floor',
    priority: 'Critical',
    status: 'In Progress',
    assignedStaff: staff1._id,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(1, 9),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[3], daysAgo(3)],
    ['Under Review', 'Verified with hostel warden', admin, daysAgo(2, 9)],
    ['Assigned', 'Assigned to Ramesh Kumar (Maintenance)', admin, daysAgo(2, 11)],
    ['In Progress', 'Plumber working on the overhead pipeline', staff1, daysAgo(1, 9)],
  ]);

  // 5. In progress (Karan — classroom fans)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[4],
    title: 'Three ceiling fans not working in room CE-101',
    category: categories['Electricity']._id,
    description:
      'Three of the six ceiling fans in CE-101 are not working. Afternoon classes are very difficult in this heat.',
    location: 'CE Block, Room 101',
    priority: 'High',
    status: 'In Progress',
    assignedStaff: staff1._id,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(2, 14),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[4], daysAgo(5)],
    ['Under Review', 'Under review', admin, daysAgo(4)],
    ['Assigned', 'Assigned to Ramesh Kumar (Maintenance)', admin, daysAgo(3)],
    ['In Progress', 'Electrician scheduled; capacitors being replaced', staff1, daysAgo(2, 14)],
  ]);

  // 6. Assigned (Arjun — library seats)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[0],
    title: 'Broken chairs in library reading hall',
    category: categories['Library']._id,
    description:
      'At least five chairs in the reading hall have broken backrests and sharp edges. Students can get hurt.',
    location: 'Central Library, Reading Hall',
    priority: 'Medium',
    status: 'Assigned',
    assignedStaff: staff1._id,
    createdAt: daysAgo(2, 11),
    updatedAt: daysAgo(1, 10),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[0], daysAgo(2, 11)],
    ['Under Review', 'Under review', admin, daysAgo(1, 9)],
    ['Assigned', 'Assigned to Ramesh Kumar (Maintenance)', admin, daysAgo(1, 10)],
  ]);

  // 7. Assigned (Priya — transport)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[1],
    title: 'Bus route 7 frequently 20 minutes late',
    category: categories['Transport']._id,
    description:
      'Route 7 bus has been arriving 15-20 minutes late every day this week. Many students miss their first lecture.',
    location: 'Route 7, City Stop',
    priority: 'Medium',
    status: 'Assigned',
    assignedStaff: staff2._id,
    createdAt: daysAgo(2, 15),
    updatedAt: daysAgo(1, 12),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[1], daysAgo(2, 15)],
    ['Under Review', 'Route timing data collected', admin, daysAgo(1, 9)],
    ['Assigned', 'Assigned to Sunita Sharma for coordination', admin, daysAgo(1, 12)],
  ]);

  // 8. Under review (Rahul — cleaning)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[2],
    title: 'Corridor near EC block not swept for a week',
    category: categories['Cleaning']._id,
    description:
      'The second floor corridor of the EC block has not been cleaned for about a week. Dust and litter are piling up near the stairs.',
    location: 'EC Block, 2nd Floor Corridor',
    priority: 'Low',
    status: 'Under Review',
    createdAt: daysAgo(1, 10),
    updatedAt: daysAgo(1, 13),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[2], daysAgo(1, 10)],
    ['Under Review', 'Queued for housekeeping review', admin, daysAgo(1, 13)],
  ]);

  // 9. Under review (Sneha — canteen prices)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[3],
    title: 'Canteen raised prices without any notice',
    category: categories['Canteen']._id,
    description:
      'Most snack prices increased by Rs. 10-15 this week without any notice or updated rate card on display.',
    location: 'Main Canteen',
    priority: 'Low',
    status: 'Under Review',
    createdAt: daysAgo(1, 14),
    updatedAt: daysAgo(1, 16),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[3], daysAgo(1, 14)],
    ['Under Review', 'Checking with canteen contractor', admin, daysAgo(1, 16)],
  ]);

  // 10. Submitted (Karan — parking)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[4],
    title: 'Two-wheelers parked blocking the CE block entrance',
    category: categories['Infrastructure']._id,
    description:
      'Vehicles are parked right in front of the CE block ramp, blocking wheelchair access and the emergency exit path.',
    location: 'CE Block Main Entrance',
    priority: 'High',
    status: 'Submitted',
    createdAt: daysAgo(0, 9),
    updatedAt: daysAgo(0, 9),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[4], daysAgo(0, 9)],
  ]);

  // 11. Rejected (Rahul — duplicate classroom issue)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[2],
    title: 'AC remote missing in EC-301 (repeat)',
    category: categories['Classroom']._id,
    description:
      'The AC remote in EC-301 is missing again. This is the same issue reported last month which was already resolved.',
    location: 'EC Block, Room 301',
    priority: 'Low',
    status: 'Rejected',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(5, 10),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[2], daysAgo(6)],
    ['Rejected', 'Duplicate of an already-resolved complaint. Please report only if the issue recurs.', admin, daysAgo(5, 10)],
  ]);

  // 12. Resolved + feedback (Arjun — hostel laundry)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[0],
    title: 'Hostel laundry machines out of order for 10 days',
    category: categories['Hostel']._id,
    description:
      'Both washing machines in hostel block A have been out of order for more than a week with no repair update.',
    location: 'Hostel Block A, Laundry Room',
    priority: 'High',
    status: 'Resolved',
    assignedStaff: staff1._id,
    resolutionNotes: 'Drain motor replaced in both machines; tested with full cycles.',
    createdAt: daysAgo(16),
    updatedAt: daysAgo(11, 15),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[0], daysAgo(16)],
    ['Under Review', 'Under review', admin, daysAgo(15)],
    ['Assigned', 'Assigned to Ramesh Kumar (Maintenance)', admin, daysAgo(14)],
    ['In Progress', 'Spare parts ordered', staff1, daysAgo(13)],
    ['Resolved', 'Both machines repaired and tested', staff1, daysAgo(11, 15)],
  ]);
  await Feedback.create({
    complaint: c._id,
    student: students[0],
    rating: 3,
    comment: 'Fixed eventually, but it took longer than expected.',
    createdAt: daysAgo(10),
  });

  // 13. Resolved + feedback (Priya — drinking water cooler)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[1],
    title: 'Water cooler dispenses warm water near IT block',
    category: categories['Water']._id,
    description:
      'The water cooler outside the IT block only dispenses warm water. Complaints to the nearby staff have not helped.',
    location: 'IT Block, Ground Floor Corridor',
    priority: 'Medium',
    status: 'Resolved',
    assignedStaff: staff1._id,
    resolutionNotes: 'Cooling compressor repaired and temperature verified.',
    createdAt: daysAgo(9),
    updatedAt: daysAgo(6, 12),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[1], daysAgo(9)],
    ['Under Review', 'Under review', admin, daysAgo(8)],
    ['Assigned', 'Assigned to Ramesh Kumar (Maintenance)', admin, daysAgo(7)],
    ['In Progress', 'Compressor repair in progress', staff1, daysAgo(7, 15)],
    ['Resolved', 'Cooler cooling normally again', staff1, daysAgo(6, 12)],
  ]);
  await Feedback.create({
    complaint: c._id,
    student: students[1],
    rating: 5,
    comment: 'Perfect, thank you!',
    createdAt: daysAgo(5),
  });

  // 14. In progress (Rahul — Wi-Fi hostel)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[2],
    title: 'No Wi-Fi coverage in hostel block C common room',
    category: categories['Internet/Wi-Fi']._id,
    description:
      'The common room of hostel block C has almost no Wi-Fi signal. Students who study there in the evening cannot access the intranet.',
    location: 'Hostel Block C, Common Room',
    priority: 'Medium',
    status: 'In Progress',
    assignedStaff: staff2._id,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1, 11),
  });
  await mkHistory(c, [
    ['Submitted', 'Complaint submitted', students[2], daysAgo(4)],
    ['Under Review', 'Signal survey scheduled', admin, daysAgo(3)],
    ['Assigned', 'Assigned to Sunita Sharma (IT Support)', admin, daysAgo(2)],
    ['In Progress', 'Additional access point being installed', staff2, daysAgo(1, 11)],
  ]);

  // 15. Submitted (Sneha — classroom projector remote)
  c = await Complaint.create({
    complaintId: await nextId(2026),
    student: students[3],
    title: 'Classroom projector remote missing in ME-201',
    category: categories['Classroom']._id,
    description:
      'The projector remote for ME-201 has been missing for two days, so lectures cannot switch slides.',
    location: 'ME Block, Room 201',
    priority: 'Low',
    status: 'Submitted',
    createdAt: daysAgo(0, 11),
    updatedAt: daysAgo(0, 11),
  });
  await mkHistory(c, [['Submitted', 'Complaint submitted', students[3], daysAgo(0, 11)]]);

  console.log('\nFixing updatedAt from last status-history entry...');
  // Mongoose timestamps overwrite updatedAt on create, so we set it from the
  // last history entry afterwards (timestamps: false keeps our explicit value).
  const allComplaints = await Complaint.find().select('_id');
  for (const doc of allComplaints) {
    const last = await ComplaintStatusHistory.findOne({ complaint: doc._id })
      .sort({ changedAt: -1 })
      .select('changedAt');
    if (last) {
      await Complaint.updateOne(
        { _id: doc._id },
        { $set: { updatedAt: last.changedAt } },
        { timestamps: false }
      );
    }
  }

  console.log('\nSyncing complaint ID counter...');
  await Counter.findOneAndUpdate(
    { _id: `complaint_${new Date().getFullYear()}` },
    { $set: { seq: seq } },
    { upsert: true }
  );

  console.log('\n============================================');
  console.log(' Seed completed successfully!');
  console.log('============================================');
  console.log('\nDemo login credentials:\n');
  console.log('ADMIN  | admin@college.edu    | admin123');
  console.log('STAFF  | staff1@college.edu   | staff123   (Ramesh Kumar - Maintenance)');
  console.log('STAFF  | staff2@college.edu   | staff123   (Sunita Sharma - IT Support)');
  console.log('STUDENT| arjun@college.edu    | student123');
  console.log('STUDENT| priya@college.edu    | student123');
  console.log('STUDENT| rahul@college.edu    | student123');
  console.log('STUDENT| sneha@college.edu    | student123');
  console.log('STUDENT| karan@college.edu    | student123');
  console.log(`\nCreated: ${students.length + 3} users, ${Object.keys(categories).length} categories, ${seq} complaints.\n`);
};

seed()
  .then(() => mongoose.connection.close())
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
