// City Of Los Santos starter. Add your Supabase URL and anon key below.
const SUPABASE_URL = "https://kyosnsplubacxqgdvqpk.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_OvSyDiY9_2hDu1GgqVpK8w_IeQKpGRd";
const configured = SUPABASE_URL.startsWith("https://") && !SUPABASE_URL.includes("YOUR_") && !SUPABASE_ANON_KEY.includes("YOUR_");
const db = configured && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let currentCategory = "announcements";
let currentUser = null;
let registering = false;
const $ = (id) => document.getElementById(id);
const categoryNames = {announcements:"ANNOUNCEMENTS",general:"GENERAL DISCUSSION",gangs:"GANGS & ORGANIZATIONS",support:"SUPPORT & APPEALS"};
function toast(message){$("toast").textContent=message;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),3500)}
function requireSetup(){if(!db){toast("Connect Supabase first — see README.md");return false}return true}
function showAuth(){ $("auth-modal").classList.remove("hidden"); $("auth-message").textContent=""; updateAuthUI() }
function hideAuth(){ $("auth-modal").classList.add("hidden") }
function updateAuthUI(){
  $("account-toggle").textContent=currentUser ? "MY ACCOUNT" : "ACCOUNT";
  $("side-account").textContent=currentUser ? "SIGNED IN" : "CREATE ACCOUNT";
  $("auth-heading").textContent=currentUser ? "YOU'RE SIGNED IN." : (registering ? "CREATE ACCOUNT." : "WELCOME BACK.");
  $("auth-submit").textContent=registering ? "REGISTER" : "SIGN IN";
  $("auth-mode").textContent=registering ? "Already registered? Sign in" : "Need an account? Register";
  $("sign-out").classList.toggle("hidden",!currentUser);
  $("auth-form").classList.toggle("hidden",!!currentUser);
  if(currentUser) $("auth-message").textContent=currentUser.email;
}
async function refreshPosts(){
  const target=$("posts");
  if(!db){target.innerHTML='<p class="muted empty">Forum is ready for setup. Add your Supabase keys to app.js and run supabase.sql.</p>';return}
  const {data,error}=await db.from("forum_posts").select("id,title,body,category,created_at,profiles(display_name)").eq("category",currentCategory).order("created_at",{ascending:false}).limit(30);
  if(error){target.textContent="Could not load topics. Check your database setup.";return}
  if(!data.length){target.innerHTML='<p class="muted empty">No topics yet. Sign in and start the conversation.</p>';return}
  target.innerHTML=data.map(p=>`<article class="post"><h4>${escapeHtml(p.title)}</h4><p>${escapeHtml(p.body)}</p><div class="post-meta">BY ${escapeHtml(p.profiles?.display_name||"COMMUNITY MEMBER")} · ${new Date(p.created_at).toLocaleString()}</div></article>`).join("");
}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function setUser(user){currentUser=user;updateAuthUI();await refreshPosts()}
$("year").textContent=new Date().getFullYear();
$("account-toggle").addEventListener("click",showAuth);
$("side-account").addEventListener("click",showAuth);
$("close-auth").addEventListener("click",hideAuth);
$("auth-mode").addEventListener("click",()=>{registering=!registering;updateAuthUI();$("auth-message").textContent=""});
$("auth-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!requireSetup())return;
  const email=$("auth-email").value.trim(),password=$("auth-password").value;
  const result=registering?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});
  if(result.error){$("auth-message").textContent=result.error.message;return}
  if(registering&&!result.data.session){$("auth-message").textContent="Check your email to confirm your account, then sign in.";return}
  await setUser(result.data.user);toast(registering?"Account created.":"Signed in.");if(result.data.session)hideAuth();
});
$("sign-out").addEventListener("click",async()=>{if(db)await db.auth.signOut();await setUser(null);toast("Signed out.");});
document.querySelectorAll(".category").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".category").forEach(x=>x.classList.remove("active"));btn.classList.add("active");currentCategory=btn.dataset.category;$("topic-heading").textContent=categoryNames[currentCategory];refreshPosts()}));
$("new-post").addEventListener("click",()=>{if(!currentUser){showAuth();toast("Sign in before creating a topic.");return}if(!requireSetup())return;$("post-form").classList.remove("hidden");$("post-title").focus()});
$("cancel-post").addEventListener("click",()=>$("post-form").classList.add("hidden"));
$("post-form").addEventListener("submit",async e=>{e.preventDefault();if(!currentUser||!requireSetup())return;const {error}=await db.from("forum_posts").insert({title:$("post-title").value.trim(),body:$("post-body").value.trim(),category:currentCategory,user_id:currentUser.id});if(error){toast(error.message);return}$("post-title").value="";$("post-body").value="";$("post-form").classList.add("hidden");toast("Topic published.");refreshPosts()});
let selectedApplication="";
document.querySelectorAll(".application-tile").forEach(btn=>btn.addEventListener("click",()=>{selectedApplication=btn.dataset.app;$("application-heading").textContent=selectedApplication.toUpperCase()+" APPLICATION";$("application-form").classList.remove("hidden");$("application-form").scrollIntoView({behavior:"smooth",block:"center"})}));
$("close-application").addEventListener("click",()=>$("application-form").classList.add("hidden"));
$("application-form").addEventListener("submit",async e=>{e.preventDefault();if(!currentUser){showAuth();toast("Create an account or sign in before applying.");return}if(!requireSetup())return;const {error}=await db.from("applications").insert({type:selectedApplication,applicant_name:$("app-name").value.trim(),discord_username:$("app-discord").value.trim(),details:$("app-details").value.trim(),user_id:currentUser.id});if(error){toast(error.message);return}$("application-form").reset();$("application-form").classList.add("hidden");toast("Application submitted. Thank you.");});
if(db){db.auth.getSession().then(({data})=>setUser(data.session?.user??null));db.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));}else{refreshPosts()}
