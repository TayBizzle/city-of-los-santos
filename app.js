// City Of Los Santos community site. Use the Supabase publishable/anon key only.
const SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL";
const SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY";
const configured=SUPABASE_URL.startsWith("https://")&&!SUPABASE_URL.includes("YOUR_")&&!SUPABASE_ANON_KEY.includes("YOUR_");
const db=configured&&window.supabase?window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
let currentCategory="announcements",currentUser=null,currentRole="member",registering=false,selectedApplication="";
const $=id=>document.getElementById(id);
const categoryNames={announcements:"ANNOUNCEMENTS",general:"GENERAL DISCUSSION",gangs:"GANGS & ORGANIZATIONS",support:"SUPPORT & APPEALS"};
function toast(message){const el=$("toast");el.textContent=message;el.classList.remove("hidden");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add("hidden"),3500)}
function requireSetup(){if(!db){toast("Supabase is not connected. Add your Project URL and publishable key in app.js.");return false}return true}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showAuth(){$("auth-modal").classList.remove("hidden");$("auth-message").textContent="";updateAuthUI()}
function hideAuth(){$("auth-modal").classList.add("hidden")}
function updateAuthUI(){
 $("account-label").textContent=currentUser?(currentUser.email||"My account"):"Account";
 $("side-account").textContent=currentUser?"SIGNED IN":"CREATE ACCOUNT";
 $("auth-heading").textContent=currentUser?"YOU'RE SIGNED IN.":(registering?"CREATE ACCOUNT.":"WELCOME BACK.");
 $("auth-submit").textContent=registering?"REGISTER":"SIGN IN";
 $("auth-mode").textContent=registering?"Already registered? Sign in":"Need an account? Register";
 $("sign-out").classList.toggle("hidden",!currentUser);$("auth-form").classList.toggle("hidden",!!currentUser);
 $("auth-message").textContent=currentUser?currentUser.email:"";
 $("staff-tools").classList.toggle("hidden",!(currentUser&&["admin","moderator"].includes(currentRole)));
}
async function refreshPosts(){
 const target=$("posts");
 if(!db){target.innerHTML='<p class="empty">Community preview is available. Connect Supabase to enable accounts, posts, and applications.</p>';return}
 const {data,error}=await db.from("forum_posts").select("id,title,body,category,created_at,profiles(display_name)").eq("category",currentCategory).order("created_at",{ascending:false}).limit(30);
 if(error){target.textContent="Could not load topics. Check the Supabase tables and policies.";return}
 if(!data?.length){target.innerHTML='<p class="empty">No topics yet. Sign in and start the conversation.</p>';return}
 target.innerHTML=data.map(p=>'<article class="post"><h4>'+escapeHtml(p.title)+'</h4><p>'+escapeHtml(p.body)+'</p><div class="post-meta">BY '+escapeHtml(p.profiles?.display_name||"COMMUNITY MEMBER")+' · '+new Date(p.created_at).toLocaleString()+'</div></article>').join("");
}
async function loadStaffApplications(){
 if(!db||!currentUser||!["admin","moderator"].includes(currentRole))return;
 const target=$("staff-applications");target.innerHTML='<p class="empty">Loading applications...</p>';
 const {data,error}=await db.from("applications").select("id,type,applicant_name,discord_username,details,status,created_at").order("created_at",{ascending:false}).limit(100);
 if(error){target.textContent="Could not load applications. Apply the staff policies from supabase.sql.";return}
 if(!data?.length){target.innerHTML='<p class="empty">No applications submitted yet.</p>';return}
 target.innerHTML=data.map(a=>'<article class="staff-application"><div class="staff-status">'+escapeHtml(a.status)+'</div><h4>'+escapeHtml(a.type)+' — '+escapeHtml(a.applicant_name)+'</h4><div class="post-meta">Discord: '+escapeHtml(a.discord_username)+' · '+new Date(a.created_at).toLocaleString()+'</div><p>'+escapeHtml(a.details)+'</p><div class="staff-actions"><button class="subtle-button" data-id="'+a.id+'" data-status="reviewing">MARK REVIEWING</button><button class="create-button" data-id="'+a.id+'" data-status="accepted">ACCEPT</button><button class="subtle-button" data-id="'+a.id+'" data-status="declined">DECLINE</button></div></article>').join("");
 target.querySelectorAll("button[data-id]").forEach(b=>b.addEventListener("click",()=>updateApplication(b.dataset.id,b.dataset.status)));
}
async function updateApplication(id,status){
 const {error}=await db.from("applications").update({status}).eq("id",id);
 if(error){toast("Could not update application: "+error.message);return}
 toast("Application marked "+status+".");loadStaffApplications();
}
async function setUser(user){
 currentUser=user;currentRole="member";
 if(db&&user){const {data}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();currentRole=data?.role||"member"}
 updateAuthUI();await refreshPosts();if(user&&["admin","moderator"].includes(currentRole))await loadStaffApplications();
}
$("year").textContent=new Date().getFullYear();
$("account-toggle").addEventListener("click",showAuth);$("side-account").addEventListener("click",showAuth);$("close-auth").addEventListener("click",hideAuth);
$("auth-mode").addEventListener("click",()=>{registering=!registering;updateAuthUI();$("auth-message").textContent=""});
$("auth-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!requireSetup())return;
 const email=$("auth-email").value.trim(),password=$("auth-password").value;
 const r=registering?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
 if(r.error){$("auth-message").textContent=r.error.message;return}
 if(registering&&!r.data.session){$("auth-message").textContent="Check your email to confirm your account, then sign in.";return}
 await setUser(r.data.user);toast(registering?"Account created.":"Signed in.");if(r.data.session)hideAuth();
});
$("sign-out").addEventListener("click",async()=>{if(db)await db.auth.signOut();await setUser(null);hideAuth();toast("Signed out.")});
document.querySelectorAll(".category").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".category").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentCategory=b.dataset.category;$("topic-heading").textContent=categoryNames[currentCategory];refreshPosts()}));
$("new-post").addEventListener("click",()=>{if(!currentUser){showAuth();toast("Sign in before creating a topic.");return}if(!requireSetup())return;$("post-form").classList.remove("hidden");$("post-title").focus()});
$("cancel-post").addEventListener("click",()=>$("post-form").classList.add("hidden"));
$("post-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!currentUser||!requireSetup())return;
 const title=$("post-title").value.trim(),body=$("post-body").value.trim();if(!title||!body)return;
 const {error}=await db.from("forum_posts").insert({title,body,category:currentCategory,user_id:currentUser.id});
 if(error){toast(error.message);return}
 $("post-title").value="";$("post-body").value="";$("post-form").classList.add("hidden");toast("Topic published.");refreshPosts();
});
document.querySelectorAll(".application-tile").forEach(b=>b.addEventListener("click",()=>{selectedApplication=b.dataset.app;$("application-heading").textContent=selectedApplication.toUpperCase()+" APPLICATION";$("application-form").classList.remove("hidden");$("application-form").scrollIntoView({behavior:"smooth",block:"center"})}));
$("close-application").addEventListener("click",()=>$("application-form").classList.add("hidden"));
$("application-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!currentUser){showAuth();toast("Create an account or sign in before applying.");return}if(!requireSetup())return;
 const {error}=await db.from("applications").insert({type:selectedApplication,applicant_name:$("app-name").value.trim(),discord_username:$("app-discord").value.trim(),details:$("app-details").value.trim(),user_id:currentUser.id});
 if(error){toast(error.message);return}$("application-form").reset();$("application-form").classList.add("hidden");toast("Application submitted. Thank you.");
});
if(db){db.auth.getSession().then(({data,error})=>{if(error)toast(error.message);return setUser(data?.session?.user??null)});db.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null))}
else{updateAuthUI();refreshPosts()}
