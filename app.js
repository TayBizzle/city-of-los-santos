// City Of Los Santos community site. Use the Supabase publishable/anon key only.
const SUPABASE_URL="https://kyosnsplubacxqgdvqpk.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_OvSyDiY9_2hDu1GgqVpK8w_IeQKpGRd";
const configured=SUPABASE_URL.startsWith("https://")&&!SUPABASE_URL.includes("YOUR_")&&!SUPABASE_ANON_KEY.includes("YOUR_");
const db=configured&&window.supabase?window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
let currentCategory="civilian",currentUser=null,currentRole="member",currentProfile=null,registering=false,selectedApplication="";
const $=id=>document.getElementById(id);
const categoryNames={civilian:"CIVILIAN CENTER",factions:"FACTION CENTER",ooc:"OUT OF CHARACTER"};
function toast(message){const el=$("toast");el.textContent=message;el.classList.remove("hidden");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add("hidden"),3500)}
function requireSetup(){if(!db){toast("Supabase is not connected. Check the Supabase client script and project settings.");return false}return true}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showAuth(){$("auth-modal").classList.remove("hidden");$("auth-message").textContent="";updateAuthUI()}
function hideAuth(){$("auth-modal").classList.add("hidden")}
function setAvatarImage(container,url,fallback){const el=$(container);if(!el)return;if(url){el.innerHTML='<img src="'+escapeHtml(url)+'" alt="" />';}else{el.textContent=fallback||"LS";}}
function updateAuthUI(){
 $("account-label").textContent=currentUser?(currentProfile?.display_name||"My account"):"Account";
 setAvatarImage("account-avatar",currentProfile?.avatar_url,(currentProfile?.display_name||"LS").slice(0,2).toUpperCase());
 $("side-account").textContent=currentUser?"MY PROFILE":"CREATE ACCOUNT";
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
 const {data,error}=await db.from("forum_posts").select("id,title,body,category,created_at,user_id,profiles(display_name,role,avatar_url)").eq("category",currentCategory).order("created_at",{ascending:false}).limit(30);
 if(error){target.textContent="Could not load topics. Check the Supabase tables and policies.";return}
 if(!data?.length){target.innerHTML='<p class="empty">No topics yet. Sign in and start the conversation.</p>';return}
 target.innerHTML=data.map(p=>'<article class="post"><h4>'+escapeHtml(p.title)+'</h4><p>'+escapeHtml(p.body)+'</p><div class="post-meta">BY <button class="member-link" data-user="'+p.user_id+'" type="button">'+(p.profiles?.avatar_url?'<img class="member-avatar" src="'+escapeHtml(p.profiles.avatar_url)+'" alt="">':'<span class="member-avatar-fallback">LS</span>')+escapeHtml(p.profiles?.display_name||"COMMUNITY MEMBER")+'</button> · '+new Date(p.created_at).toLocaleString()+'</div></article>').join("");
 target.querySelectorAll(".member-link").forEach(b=>b.addEventListener("click",()=>openMemberProfile(b.dataset.user)));
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
 currentUser=user;currentRole="member";currentProfile=null;
 if(db&&user){const {data}=await db.from("profiles").select("id,display_name,role,avatar_url,created_at").eq("id",user.id).maybeSingle();currentProfile=data;currentRole=data?.role||"member"}
 updateAuthUI();await refreshPosts();if(user&&["admin","moderator"].includes(currentRole))await loadStaffApplications();
}
$("year").textContent=new Date().getFullYear();
$("account-toggle").addEventListener("click",()=>currentUser?openMemberProfile(currentUser.id,true):showAuth());$("side-account").addEventListener("click",()=>currentUser?openMemberProfile(currentUser.id,true):showAuth());$("close-auth").addEventListener("click",hideAuth);
$("close-profile").addEventListener("click",()=>$("profile-modal").classList.add("hidden"));
async function openMemberProfile(userId,own=false){
 if(!db)return;
 const {data,error}=await db.from("profiles").select("id,display_name,role,created_at").eq("id",userId).maybeSingle();
 if(error||!data){toast("Could not load this member profile.");return}
 $("profile-name").textContent=data.display_name||"Community Member";
 $("profile-avatar").src=data.avatar_url||"";$("profile-avatar").classList.toggle("hidden",!data.avatar_url);$("profile-avatar-fallback").classList.toggle("hidden",!!data.avatar_url);$("profile-avatar-fallback").textContent=(data.display_name||"LS").slice(0,2).toUpperCase();
 $("profile-role").textContent=(data.role||"member").toUpperCase();
 $("profile-joined").textContent="Member since "+new Date(data.created_at).toLocaleDateString();
 $("profile-edit").classList.toggle("hidden",!(own&&currentUser&&currentUser.id===userId));
 $("display-name-input").value=data.display_name||"";
 $("profile-modal").classList.remove("hidden");
}
$("upload-avatar").addEventListener("click",async()=>{
 if(!currentUser||!requireSetup())return;
 const file=$("avatar-file").files[0];
 if(!file){toast("Choose a profile picture first.");return}
 if(!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type)){toast("Choose a PNG, JPG, WEBP, or GIF image.");return}
 if(file.size>2*1024*1024){toast("Profile pictures must be 2 MB or smaller.");return}
 const ext=({ "image/png":"png","image/jpeg":"jpg","image/webp":"webp","image/gif":"gif"})[file.type];
 const path=currentUser.id+"/avatar."+ext;
 const {error:uploadError}=await db.storage.from("avatars").upload(path,file,{upsert:true,contentType:file.type,cacheControl:"3600"});
 if(uploadError){toast("Upload failed. Run the profile picture setup SQL first.");return}
 const {data:{publicUrl}}=db.storage.from("avatars").getPublicUrl(path);
 const avatarUrl=publicUrl+"?v="+Date.now();
 const {data,error}=await db.from("profiles").update({avatar_url:avatarUrl}).eq("id",currentUser.id).select("id,display_name,role,avatar_url,created_at").single();
 if(error){toast("Picture uploaded, but profile could not be updated. Run the profile setup SQL.");return}
 currentProfile=data;updateAuthUI();$("profile-avatar").src=avatarUrl;$("profile-avatar").classList.remove("hidden");$("profile-avatar-fallback").classList.add("hidden");$("avatar-file").value="";toast("Profile picture updated.");refreshPosts();
});
$("save-display-name").addEventListener("click",async()=>{
 const name=$("display-name-input").value.trim();
 if(name.length<3||name.length>24){toast("Forum names must be 3–24 characters.");return}
 if(!/^[a-zA-Z0-9 _.-]+$/.test(name)){toast("Use letters, numbers, spaces, dots, underscores, or hyphens.");return}
 const {data,error}=await db.from("profiles").update({display_name:name}).eq("id",currentUser.id).select("id,display_name,role,avatar_url,created_at").single();
 if(error){toast("Could not save forum name. Run the profile setup SQL first.");return}
 currentProfile=data;currentRole=data.role;updateAuthUI();$("profile-name").textContent=data.display_name;$("profile-role").textContent=(data.role||"member").toUpperCase();toast("Forum name updated.");refreshPosts();
});
$("auth-mode").addEventListener("click",()=>{registering=!registering;updateAuthUI();$("auth-message").textContent=""});
$("forgot-password").addEventListener("click",async()=>{if(!requireSetup())return;const email=$("auth-email").value.trim();if(!email){$("auth-message").textContent="Enter your email address first.";return}const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});$("auth-message").textContent=error?error.message:"Password reset email sent. Check your inbox and spam folder.";});
$("password-reset-form").addEventListener("submit",async e=>{e.preventDefault();const password=$("new-password").value;if(password.length<8){$("auth-message").textContent="Use at least 8 characters.";return}const {error}=await db.auth.updateUser({password});$("auth-message").textContent=error?error.message:"Password updated! You can now sign in with your new password.";if(!error){$("password-reset-form").classList.add("hidden");$("auth-form").classList.remove("hidden");$("auth-password").value="";}});
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
function showPasswordReset(){
 $("auth-modal").classList.remove("hidden");
 $("auth-form").classList.add("hidden");
 $("password-reset-form").classList.remove("hidden");
 $("auth-heading").textContent="RESET YOUR PASSWORD";
 $("auth-message").textContent="Choose a new password.";
 $("forgot-password").classList.add("hidden");
 $("auth-mode").classList.add("hidden");
 $("sign-out").classList.add("hidden");
}
if(db){
 db.auth.onAuthStateChange((event,session)=>{
  if(event==="PASSWORD_RECOVERY")showPasswordReset();
  setUser(session?.user??null);
 });
 // Also recognize recovery links on direct page load in case the auth event fires before the UI is ready.
 const recoveryUrl=new URL(window.location.href);
 if(window.location.hash.includes("type=recovery")||recoveryUrl.searchParams.get("type")==="recovery")showPasswordReset();
 db.auth.getSession().then(({data,error})=>{if(error)toast(error.message);return setUser(data?.session?.user??null)});
}
else{updateAuthUI();refreshPosts()}
