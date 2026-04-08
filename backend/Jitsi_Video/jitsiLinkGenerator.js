const { v4: uuidv4 } = require('uuid');

// CONFIGURATION
// You can use the public server or your own
const JITSI_DOMAIN = 'https://meet.jit.si';

/**
 * Generates a unique video call link.
 * Since no JWT is used, the link itself does not carry permissions.
 * The "Doctor" must join first to become the Admin.
 */
function createMeetingLink(doctorName, patientName) {
    
    // 1. Create a Unique Room ID
    // We use UUID to ensure the room name is unguessable (e.g., '6c84fb90-12c4-11e1-840d-7b25c5ee775a')
    // This acts as a security layer so random people don't crash the call.
    const uniqueId = uuidv4();
    
    // 2. Optional: Add a prefix for readability (Sanitize names to remove spaces)
    const sanitizedDoctor = doctorName.replace(/[^a-zA-Z0-9]/g, '');
    const sanitizedPatient = patientName.replace(/[^a-zA-Z0-9]/g, '');
    
    // Room Name Format: DoctorName-PatientName-UniqueID
    const roomName = `${sanitizedDoctor}-${sanitizedPatient}-${uniqueId}`;

    // 3. Construct the Link
    const meetingUrl = `${JITSI_DOMAIN}/${roomName}`;

    // 4. Return the response object
    return {
        success: true,
        roomId: roomName,
        meetingDetails: {
            doctor_link: meetingUrl,
            patient_link: meetingUrl, // Without JWT, the link is identical
            note: "The Doctor MUST join this link first to claim Admin rights."
        },
        generatedAt: new Date()
    };
}

// --- EXAMPLE USAGE (Simulating an API call) ---

// Input Data (from your request body)
const doctor = "Dr. Strange";
const patient = "Tony Stark";

console.log("Generating Jitsi Link...");
const result = createMeetingLink(doctor, patient);

// Output the result
console.log(JSON.stringify(result, null, 2));

// In a real Express app, you would do:
// res.json(result);