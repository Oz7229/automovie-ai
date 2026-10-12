# CreateFlow AI Studio

Build a production-ready AI-powered faceless YouTube content creation and video editing platform.

PROJECT NAME:

CreateFlow AI

CORE PURPOSE:

CreateFlow AI is an AI video production studio designed primarily for creators who make faceless YouTube videos.

The platform should take a creator from:

IDEA/TOPIC

→ LIVE RESEARCH

→ CONTENT OUTLINE

→ SCRIPT

→ VOICEOVER

→ VISUAL PLAN

→ ASSET GENERATION

→ VIDEO EDITING

→ CAPTIONS

→ THUMBNAIL

→ SEO

→ FINAL EXPORT

The goal is to automate as much of the faceless YouTube production process as possible while still allowing the creator to control and edit everything.

IMPORTANT:

This must NOT be designed as a simple chatbot.

It should feel like a professional AI production application similar to a combination of:

- AI research assistant

- AI scriptwriter

- AI voice studio

- AI video editor

- AI media generator

- YouTube content planner

The interface should be clean, modern, premium, fast, and professional.

==================================================

1. APPLICATION STRUCTURE

==================================================

Create the following main navigation:

Dashboard

Projects

Create New Video

Research

Scripts

Voiceovers

Media Library

Video Editor

Thumbnails

YouTube SEO

AI Agents

Templates

Settings

The application should have a persistent left sidebar on desktop.

Top navigation should include:

- Current project

- Search

- Notifications

- AI assistant

- User profile

The application must be fully responsive.

Desktop should be the primary experience because video editing is the main use case.

==================================================

2. DASHBOARD

==================================================

Create a professional creator dashboard.

Display:

Welcome message.

"Create your next video"

Primary button:

"+ New Video"

Dashboard cards:

Projects

Videos in production

Completed videos

Total generated minutes

Voiceover minutes

Storage used

Recent Projects section.

Each project should show:

- Thumbnail

- Project name

- Status

- Progress percentage

- Last edited

- Duration

- Continue Editing button

Create a "Production Pipeline" section showing:

Research

Script

Voiceover

Visuals

Editing

Thumbnail

SEO

Export

Each stage should have a status:

Not Started

In Progress

Completed

Needs Review

==================================================

3. CREATE NEW VIDEO

==================================================

When the user clicks "+ New Video", open a project creation wizard.

Step 1:

Choose creation method.

Options:

A. Start from a Topic

B. Paste a Script

C. Upload a Script

D. Create from YouTube URL

E. Start from Template

For "Start from a Topic", ask:

Video Topic

Target Audience

YouTube Channel/Niche

Desired Video Length

Tone

Content Style

Language

Country/Region

Optional keywords

Optional competitor videos

Optional instructions

Example:

Topic:

"20 Indoor Plants That Thrive in Water"

Length:

20 minutes

Tone:

Educational + conversational

Style:

Faceless documentary / YouTube educational

==================================================

4. AI RESEARCH AGENT

==================================================

Create a dedicated Research Agent.

The Research Agent should be able to research topics using connected web search tools/APIs/MCPs.

IMPORTANT:

The architecture must allow external research providers to be connected later.

Possible integrations:

Google Search

SerpAPI

Tavily

Perplexity

Firecrawl

Browser/search MCP

Other web research MCPs

Do not hardcode one provider.

Create an abstraction layer called:

Research Provider

The user should eventually be able to select which research provider to use.

Research Agent responsibilities:

1. Understand the topic.

2. Search the web.

3. Find current information.

4. Find authoritative sources.

5. Cross-check important claims.

6. Identify statistics.

7. Identify dates.

8. Identify expert opinions.

9. Find interesting facts.

10. Find opposing viewpoints when relevant.

11. Detect outdated information.

12. Organize findings.

13. Save sources.

14. Create citations.

15. Produce a research report.

Research interface should display:

Research Progress

Searching...

Analyzing sources...

Cross-checking information...

Extracting useful facts...

Building research report...

Then show:

Research Summary

Key Facts

Statistics

Important Points

Expert Sources

Sources

Potential Story Angles

Interesting Facts

Things To Avoid

Content Opportunities

Every research claim should ideally be associated with its source.

Allow the creator to manually add research instructions.

==================================================

5. SCRIPT WRITING AGENT

==================================================

Create a Script Agent.

The Script Agent should use:

- User topic

- Research results

- User instructions

- Channel style

- Target audience

- Desired length

- Desired tone

to generate the script.

The script generator should support:

Hook

Introduction

Context

Main Sections

Transitions

Examples

Storytelling

Pattern interrupts

Open loops

Conclusion

Call to action

Create script templates such as:

Educational

Documentary

Top 10

Listicle

Explainer

Storytelling

News

Commentary

Tutorial

Product Review

Case Study

The user should be able to create a custom writing style.

Create:

"Channel Writing Style"

where the creator can define:

Sentence length

Vocabulary

Tone

Humor level

Storytelling style

Hook style

CTA style

Words to avoid

Words to use

Intro style

Outro style

Allow the creator to save this as a reusable "Writing Skill".

==================================================

6. SCRIPT EDITOR

==================================================

Create a professional script editor.

Layout:

LEFT:

Scene/section list.

CENTER:

Script editor.

RIGHT:

AI assistant.

Each script section should support:

Scene number

Narration

Visual instructions

On-screen text

B-roll suggestions

Music

Sound effects

Duration

Example:

SCENE 01

Narration:

"Imagine waking up one morning..."

Visual:

"Slow cinematic shot of a modern apartment..."

On-screen text:

"THIS IS WHERE IT STARTS"

B-roll:

"Person opening curtains"

Music:

"Low cinematic ambient"

The user must be able to edit the script manually.

Add AI actions:

Rewrite

Shorten

Expand

Improve Hook

Make More Conversational

Make More Dramatic

Simplify

Fact Check

Continue

Change Tone

Generate Visuals

Generate Scene

==================================================

7. SCRIPT TO SCENE CONVERTER

==================================================

This is extremely important.

After the script is approved, the system should automatically convert the script into a structured video timeline.

Example:

SCENE 1

Duration: 0:00-0:18

Narration: ...

Visual: ...

B-roll: ...

Text: ...

Music: ...

SFX: ...

SCENE 2

Duration: 0:18-0:42

...

The AI should determine approximate scene durations based on narration length.

Allow the user to regenerate individual scenes without regenerating the entire project.

==================================================

8. AI VOICEOVER AGENT

==================================================

Create a Voiceover Agent.

The application architecture must support external voice providers.

Primary possible integration:

ElevenLabs

But create the architecture so other providers can be added.

Voice settings:

Voice

Language

Accent

Emotion

Stability

Similarity

Style

Speed

Allow voice preview.

Allow the user to generate:

Entire script

Individual scenes

Selected paragraphs

The generated audio should automatically be attached to the corresponding scenes.

Display:

Generating voiceover...

Processing...

Completed

Show waveform/audio player.

Allow:

Play

Pause

Regenerate

Download

Replace

Trim

Store generated audio in the project's media library.

==================================================

9. VISUAL GENERATION AGENT

==================================================

Create a Visual Director Agent.

This agent analyzes each scene and determines what visual assets are required.

For every scene generate:

Visual type:

- AI image

- AI video

- Stock video

- Stock image

- Screenshot

- Screen recording

- Motion graphic

- Text animation

- Chart

- Map

- Diagram

Create a visual prompt automatically.

Example:

Scene:

"Plants growing in water"

Visual prompt:

"Close-up cinematic shot of healthy pothos roots growing inside a clear glass jar..."

The user should be able to edit the visual prompt.

==================================================

10. IMAGE GENERATION INTEGRATIONS

==================================================

Design an integration layer for image generation.

Possible providers:

Google Gemini / Nano Banana

OpenAI image generation

Flux

Ideogram

Other compatible providers

Do NOT tightly couple the application to one provider.

Create:

Image Provider Interface

The user should eventually be able to choose the provider.

Generated images should automatically appear in the Media Library.

==================================================

11. AI VIDEO GENERATION

==================================================

Create support for AI video generation providers.

Possible integrations:

Google Veo

Runway

Kling

Luma

Pika

Other video generation APIs

Create a Video Generation Provider abstraction.

Each scene can request:

Generate AI Video

The system should send the scene's visual prompt to the selected provider.

Generated clips should automatically attach to the correct scene.

==================================================

12. STOCK MEDIA AGENT

==================================================

Create a Stock Media Agent.

Possible providers:

Pexels

Pixabay

Unsplash

Other stock media APIs

The agent should search for relevant:

Videos

Images

based on the scene description.

Show results inside the editor.

Allow:

Use

Replace

Download

Add to scene

==================================================

13. VIDEO EDITOR

==================================================

Create a professional browser-based video editor.

The editor should have:

TOP:

Project title

Undo

Redo

Preview

Export

LEFT:

Media

Scenes

Text

Audio

Transitions

Effects

Elements

CENTER:

Video preview/canvas

BOTTOM:

Timeline

RIGHT:

Inspector / Properties

Timeline should contain tracks:

Video

B-roll

Voiceover

Music

Sound Effects

Text

Captions

Users should be able to:

Drag clips

Trim clips

Split clips

Move clips

Delete clips

Resize clips

Adjust duration

Change volume

Add transitions

Add text

Add captions

Add images

Add video

Add music

Add sound effects

==================================================

14. TIMELINE ENGINE

==================================================

Design the backend data structure around a timeline.

Each project should have:

Project

Scenes

Tracks

Clips

Assets

Audio

Captions

Effects

Transitions

Each clip should contain:

id

type

assetId

startTime

duration

track

position

scale

rotation

opacity

volume

effects

transitionIn

transitionOut

The timeline must be deterministic and editable.

==================================================

15. VIDEO RENDERING

==================================================

The application should be designed to eventually render a final MP4.

Use a proper rendering architecture.

Possible rendering technologies:

FFmpeg

Remotion

Cloud rendering service

Server-side rendering workers

Do not attempt to perform heavy video rendering directly inside the browser.

Create a rendering job system.

When user clicks:

"Export Video"

show:

Preparing project

Processing voiceover

Rendering scenes

Adding captions

Adding music

Rendering final video

Finalizing

Then provide:

1080p

4K

where supported.

==================================================

16. AUTOMATIC CAPTIONS

==================================================

Create a Caption Agent.

It should automatically generate captions from the voiceover.

Support:

Word-by-word captions

Sentence captions

Highlighted keywords

Animated captions

Caption styles:

Minimal

Bold

YouTube

Documentary

Modern

Podcast

Kinetic

Allow users to customize:

Font

Size

Position

Animation

Color

Background

Stroke

==================================================

17. MUSIC AGENT

==================================================

Create a Music Agent.

The agent should analyze the script and suggest background music.

It should understand:

Mood

Energy

Scene type

Emotional intensity

Support external music providers later.

Music controls:

Volume

Fade in

Fade out

Start point

End point

Automatically duck background music when narration is playing.

==================================================

18. SOUND EFFECT AGENT

==================================================

Create an SFX Agent.

The agent should identify where sound effects would improve the video.

Examples:

Whoosh

Click

Notification

Impact

Transition

Typing

Camera shutter

Door

Nature

Crowd

Allow users to approve or reject suggested SFX.

==================================================

19. THUMBNAIL GENERATOR

==================================================

Create a Thumbnail Agent.

It should analyze:

Topic

Title

Script

Target audience

and generate several thumbnail concepts.

Provide:

Concept 1

Concept 2

Concept 3

Concept 4

Each concept should include:

Image prompt

Composition

Emotion

Text suggestion

Color direction

Visual hierarchy

Integrate with image generation providers.

Allow:

Generate

Regenerate

Edit

Download

==================================================

20. YOUTUBE SEO AGENT

==================================================

Create a YouTube SEO Agent.

Generate:

YouTube title options

Description

Tags

Keywords

Hashtags

Chapters

Pinned comment

Community post

Shorts ideas

Title generator should prioritize:

Curiosity

Clarity

CTR

Search intent

Provide multiple title variations.

Example:

High CTR

SEO-focused

Curiosity

Balanced

==================================================

21. CONTENT REPURPOSING AGENT

==================================================

After creating a long-form video, automatically generate:

YouTube Shorts

TikTok scripts

Instagram Reels scripts

LinkedIn posts

Facebook posts

X posts

The user should be able to select:

"Repurpose Video"

The AI should analyze the finished script and identify the best short-form clips.

==================================================

22. AI AGENT SYSTEM

==================================================

Create an AI Agent Manager.

Agents:

Research Agent

Script Agent

Voice Agent

Visual Director

Image Agent

Video Agent

Stock Media Agent

Caption Agent

Music Agent

Sound Effect Agent

Thumbnail Agent

SEO Agent

Repurposing Agent

Quality Control Agent

Each agent should have:

Name

Description

Instructions

Model/provider

Tools

Skills

Temperature/creativity where supported

Output format

Enabled/disabled

==================================================

23. SKILLS SYSTEM

==================================================

This is extremely important.

Create a reusable Skills system.

A Skill is a set of instructions that teaches the AI how the creator wants work performed.

Example:

"Garden YouTube Skill"

Instructions could include:

Use conversational language.

Avoid unnecessary technical language.

Create strong hooks.

Use curiosity loops.

Use short sentences.

Avoid robotic phrasing.

Use practical examples.

Do not invent facts.

Verify claims.

Use American English.

Write for a general audience.

The user should be able to:

Create Skill

Edit Skill

Duplicate Skill

Delete Skill

Assign Skill to Agent

Skills can be assigned to:

Research Agent

Script Agent

Visual Agent

SEO Agent

etc.

==================================================

24. CHANNEL PROFILES

==================================================

Allow users to create multiple YouTube channel profiles.

Each channel should have:

Channel name

Niche

Audience

Country

Language

Writing Skill

Voice

Thumbnail style

Brand colors

Intro style

Outro style

CTA

Preferred video length

When creating a video, the user chooses a channel profile.

The AI automatically applies the channel's settings.

==================================================

25. QUALITY CONTROL AGENT

==================================================

Create a final Quality Control Agent.

Before export, analyze:

Script quality

Factual accuracy

Repetition

Hook strength

Narration flow

Visual coverage

Audio quality

Caption synchronization

Scene duration

Potential copyright risks

Missing visuals

Dead sections

CTA

YouTube SEO

Generate a:

Video Quality Score

Example:

Hook: 92/100

Script: 89/100

Visual Coverage: 87/100

Audio: 95/100

Retention Potential: 90/100

SEO: 84/100

Then provide recommendations.

==================================================

26. PROJECT WORKFLOW

==================================================

The primary workflow should be:

1. User enters topic.

2. Research Agent researches topic.

3. AI creates research report.

4. User approves research.

5. Script Agent generates script.

6. User edits/approves script.

7. Script is converted into scenes.

8. Voice Agent generates narration.

9. Visual Director analyzes scenes.

10. User chooses automatic visual generation or manual control.

11. Image/Video/Stock agents generate or find assets.

12. Caption Agent generates captions.

13. Music Agent recommends music.

14. SFX Agent adds sound effects.

15. System builds timeline.

16. User enters Video Editor.

17. User manually edits anything needed.

18. Quality Control Agent reviews video.

19. Thumbnail Agent generates thumbnails.

20. SEO Agent generates metadata.

21. User exports final video.

==================================================

27. PROJECT STATES

==================================================

Use project statuses:

IDEA

RESEARCHING

RESEARCH_COMPLETE

SCRIPTING

SCRIPT_REVIEW

VOICEOVER

VISUALS

EDITING

QUALITY_CHECK

READY_TO_EXPORT

EXPORTING

COMPLETED

Display the current status clearly.

==================================================

28. DATABASE

==================================================

Use Supabase for authentication, database, storage, and backend data.

Create database tables for:

users

channels

projects

research_reports

research_sources

scripts

script_sections

scenes

assets

media_library

voiceovers

audio_tracks

video_tracks

timeline_clips

captions

music_tracks

sound_effects

thumbnails

seo_metadata

ai_agents

skills

agent_runs

generation_jobs

render_jobs

integrations

provider_settings

templates

exports

Use proper relationships.

Every project belongs to a user.

Every project can belong to a channel.

Every scene belongs to a project.

Every asset belongs to a project or user's media library.

==================================================

29. AUTHENTICATION

==================================================

Use Supabase Auth.

Support:

Email/password

Google login

Create:

Login

Signup

Forgot password

Reset password

Account settings

==================================================

30. API / MCP INTEGRATION ARCHITECTURE

==================================================

IMPORTANT:

Do NOT hardcode API keys into the frontend.

Use secure server-side functions/environment variables.

Create a provider/integration system.

Possible integrations:

Research:

Tavily

SerpAPI

Google Search

Firecrawl

Perplexity

LLM:

OpenAI

Anthropic

Google Gemini

Other compatible providers

Voice:

ElevenLabs

Google

OpenAI

Other providers

Images:

Nano Banana / Gemini

OpenAI

Flux

Ideogram

Video:

Veo

Runway

Kling

Luma

Pika

Stock:

Pexels

Pixabay

Unsplash

Rendering:

FFmpeg

Remotion

Cloud rendering

Storage:

Supabase Storage

Payments:

Stripe

Analytics:

PostHog or similar

The UI should have an Integrations page.

Each provider should show:

Connected

Not Connected

Configure

Test Connection

==================================================

31. MCP SUPPORT

==================================================

Design the architecture so external MCP tools can be connected

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://automovie-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/595ade50-27d9-4027-9f3b-21e18cedda59).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
