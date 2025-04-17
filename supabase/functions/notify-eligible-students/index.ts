
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { supabase } from "../_shared/supabase-client.ts";
import { checkJobEligibility } from "../_shared/eligibility.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotifyEligibleStudentsRequest {
  jobId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { jobId }: NotifyEligibleStudentsRequest = await req.json();
    
    if (!jobId) {
      throw new Error("Job ID is required");
    }
    
    console.log(`Processing notifications for job: ${jobId}`);
    
    // Get job details
    const { data: job, error: jobError } = await supabase
      .from("job_postings")
      .select("*")
      .eq("id", jobId)
      .single();
    
    if (jobError || !job) {
      throw new Error(`Failed to fetch job details: ${jobError?.message || "Job not found"}`);
    }

    // Only proceed for active jobs
    if (job.status !== 'active') {
      return new Response(
        JSON.stringify({ message: `Job is not active, no notifications sent` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Get all student profiles
    const { data: students, error: studentsError } = await supabase
      .from("student_profiles")
      .select(`
        id, 
        user_id,
        first_name,
        last_name,
        users(email)
      `)
      .eq("is_verified", true)
      .eq("is_blocked", false)
      .neq("is_frozen", true);
    
    if (studentsError) {
      throw new Error(`Failed to fetch students: ${studentsError.message}`);
    }
    
    console.log(`Found ${students?.length || 0} verified and eligible students`);
    
    const eligibleStudents = [];
    const eligibilityChecks = [];
    
    // Check eligibility for each student
    for (const student of students || []) {
      const checkPromise = checkJobEligibility(student.id, job)
        .then(({ isEligible }) => {
          if (isEligible) {
            eligibleStudents.push(student);
          }
        })
        .catch(error => {
          console.error(`Error checking eligibility for student ${student.id}:`, error);
        });
      
      eligibilityChecks.push(checkPromise);
    }
    
    // Wait for all eligibility checks to complete
    await Promise.all(eligibilityChecks);
    
    console.log(`Found ${eligibleStudents.length} eligible students for this job`);
    
    if (eligibleStudents.length === 0) {
      return new Response(
        JSON.stringify({ message: "No eligible students found for this job posting" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Collect email addresses of eligible students
    const eligibleEmails = eligibleStudents
      .map(student => (student.users as any)?.email)
      .filter(Boolean);
    
    if (eligibleEmails.length === 0) {
      return new Response(
        JSON.stringify({ message: "No eligible student emails found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }
    
    // Prepare and send email
    const emailSubject = `New Job Opportunity: ${job.title} at ${job.company_name}`;
    const emailBody = `
      <html>
        <body>
          <h2>New Job Opportunity</h2>
          <p>Dear Student,</p>
          <p>We are pleased to inform you that a new job opportunity matching your profile has been posted:</p>
          <div style="margin: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <h3>${job.title} at ${job.company_name}</h3>
            <p><strong>Location:</strong> ${job.location}</p>
            <p><strong>Package:</strong> ${job.package}</p>
            <p><strong>Application Deadline:</strong> ${new Date(job.application_deadline).toLocaleDateString()}</p>
            <hr>
            <p>${job.description.substring(0, 300)}${job.description.length > 300 ? '...' : ''}</p>
          </div>
          <p>To apply for this position, please login to your placement portal account.</p>
          <p>Best regards,<br>Placement Cell<br>MIT-WPU</p>
        </body>
      </html>
    `;
    
    // Send the email using the Supabase edge function for email
    const emailResult = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          from: "1032221121@mitwpu.edu.in",
          bcc: eligibleEmails,
          subject: emailSubject,
          html: emailBody,
        }),
      }
    );
    
    const emailResponse = await emailResult.json();
    console.log("Email notification result:", emailResponse);
    
    // Create notifications in the database for eligible students
    const notificationInserts = eligibleStudents.map(student => ({
      user_id: student.user_id,
      title: "New Job Opportunity",
      message: `A new job matching your profile has been posted: ${job.title} at ${job.company_name}`,
      is_read: false
    }));
    
    if (notificationInserts.length > 0) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notificationInserts);
      
      if (notificationError) {
        console.error("Error creating notifications:", notificationError);
      } else {
        console.log(`Created ${notificationInserts.length} in-app notifications`);
      }
    }
    
    return new Response(
      JSON.stringify({
        message: `Email notifications sent to ${eligibleEmails.length} eligible students`,
        emailResponse
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error("Error in notify-eligible-students function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
