import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  query: string;
  city?: string;
}

interface ExpandedQuery {
  intent: string;
  expanded_keywords: string[];
  categories_to_search: string[];
  original_query: string;
}

interface SearchResult {
  id: string;
  name: string;
  type: string;
  slug?: string;
  subtitle?: string;
  relevance_score: number;
  category?: string;
}

interface CategorizedResults {
  doctors: SearchResult[];
  labs_tests: SearchResult[];
  hospitals: SearchResult[];
  specializations: SearchResult[];
  surgeries: SearchResult[];
  nurses: SearchResult[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, city }: SearchRequest = await req.json();
    
    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: "Query must be at least 2 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Use AI to understand intent and expand query
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a medical search query analyzer for a Pakistani healthcare platform. Your job is to:
1. Understand user intent (are they looking for doctors, tests, hospitals, nurses, surgeries?)
2. Expand the query with medical synonyms and related terms
3. Handle typos, abbreviations, and layman terms
4. Translate Urdu/Roman Urdu medical terms to English equivalents

MEDICAL SYNONYM MAPPINGS (use these):
- heart doctor, heart specialist, dil ka doctor → cardiologist
- skin doctor, skin specialist → dermatologist  
- child doctor, bachon ka doctor → pediatrician
- bone doctor, haddi wala doctor → orthopedic
- sugar doctor, diabetes specialist → endocrinologist, diabetologist
- brain doctor, dimagh ka doctor → neurologist
- women doctor, lady doctor → gynecologist
- eye doctor → ophthalmologist
- teeth doctor → dentist
- chest doctor, lungs doctor → pulmonologist
- stomach doctor, pet ka doctor → gastroenterologist
- kidney doctor, gurde ka doctor → nephrologist
- heart pain, chest pain → angina, cardiac, cardiology
- sugar test, diabetes test → HbA1c, fasting blood sugar, random blood sugar, glucose
- blood test → CBC, complete blood count, hemoglobin
- liver test → LFT, liver function test, ALT, AST
- kidney test → KFT, kidney function test, creatinine, urea
- thyroid test → TSH, T3, T4, thyroid profile
- bp medicine, blood pressure → hypertension, antihypertensive
- nurse, nursing → home nursing, patient care, caregiver
- cbc → complete blood count
- ecg → electrocardiogram
- mri → magnetic resonance imaging
- ct scan → computed tomography

Return ONLY valid JSON (no markdown, no backticks) in this exact format:
{
  "intent": "doctor|test|hospital|nurse|surgery|general",
  "expanded_keywords": ["keyword1", "keyword2", "..."],
  "categories_to_search": ["doctors", "specializations", "labs_tests", "hospitals", "nurses", "surgeries"],
  "original_query": "the original query"
}`
          },
          {
            role: "user",
            content: `Analyze this medical search query and expand it: "${query}"`
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let expandedQuery: ExpandedQuery;
    
    try {
      const content = aiData.choices[0]?.message?.content || "";
      // Clean up the response - remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      expandedQuery = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiData.choices[0]?.message?.content);
      // Fallback to basic query expansion
      expandedQuery = {
        intent: "general",
        expanded_keywords: [query.toLowerCase()],
        categories_to_search: ["doctors", "specializations", "labs_tests", "hospitals", "nurses", "surgeries"],
        original_query: query
      };
    }

    console.log("Expanded query:", JSON.stringify(expandedQuery));

    // Step 2: Search all relevant tables with expanded keywords
    const results: CategorizedResults = {
      doctors: [],
      labs_tests: [],
      hospitals: [],
      specializations: [],
      surgeries: [],
      nurses: [],
    };

    const keywords = expandedQuery.expanded_keywords;
    const cityFilter = city && city !== "all" ? city : null;

    // Helper function to calculate relevance score
    const calculateRelevance = (name: string, keywords: string[], isExact: boolean = false): number => {
      const nameLower = name.toLowerCase();
      let score = 0;
      
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        if (nameLower === keywordLower) {
          score += 100; // Exact match
        } else if (nameLower.includes(keywordLower)) {
          score += isExact ? 80 : 60; // Partial match
        } else if (keywordLower.split(' ').some(word => nameLower.includes(word))) {
          score += 40; // Word match
        }
      }
      
      return score;
    };

    // Search Doctors
    if (expandedQuery.categories_to_search.includes("doctors")) {
      for (const keyword of keywords.slice(0, 5)) { // Limit to first 5 keywords
        let doctorQuery = supabase
          .from("doctors")
          .select("id, full_name, qualification, city, specialization_id")
          .eq("status", "approved")
          .or(`full_name.ilike.%${keyword}%,qualification.ilike.%${keyword}%,bio.ilike.%${keyword}%`)
          .limit(10);
        
        if (cityFilter) {
          doctorQuery = doctorQuery.eq("city", cityFilter);
        }
        
        const { data: doctors } = await doctorQuery;
        
        if (doctors) {
          for (const doc of doctors) {
            if (!results.doctors.find(d => d.id === doc.id)) {
              results.doctors.push({
                id: doc.id,
                name: doc.full_name,
                type: "doctor",
                subtitle: `${doc.qualification || "Doctor"}${doc.city ? ` • ${doc.city}` : ""}`,
                relevance_score: calculateRelevance(doc.full_name + " " + (doc.qualification || ""), keywords),
              });
            }
          }
        }
      }
    }

    // Search Specializations
    if (expandedQuery.categories_to_search.includes("specializations")) {
      for (const keyword of keywords.slice(0, 5)) {
        const { data: specs } = await supabase
          .from("doctor_specializations")
          .select("id, name, slug, description")
          .eq("is_active", true)
          .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
          .limit(10);
        
        if (specs) {
          for (const spec of specs) {
            if (!results.specializations.find(s => s.id === spec.id)) {
              results.specializations.push({
                id: spec.id,
                name: spec.name,
                type: "specialization",
                slug: spec.slug,
                subtitle: "Medical Specialization",
                relevance_score: calculateRelevance(spec.name + " " + (spec.description || ""), keywords, true),
              });
            }
          }
        }
      }
    }

    // Search Tests
    if (expandedQuery.categories_to_search.includes("labs_tests")) {
      for (const keyword of keywords.slice(0, 5)) {
        const { data: tests } = await supabase
          .from("tests")
          .select("id, name, slug, category, description")
          .eq("is_active", true)
          .or(`name.ilike.%${keyword}%,category.ilike.%${keyword}%,description.ilike.%${keyword}%`)
          .limit(10);
        
        if (tests) {
          for (const test of tests) {
            if (!results.labs_tests.find(t => t.id === test.id)) {
              results.labs_tests.push({
                id: test.id,
                name: test.name,
                type: "test",
                slug: test.slug,
                subtitle: test.category || "Lab Test",
                relevance_score: calculateRelevance(test.name + " " + (test.category || ""), keywords, true),
                category: test.category || undefined,
              });
            }
          }
        }
      }

      // Also search Labs
      for (const keyword of keywords.slice(0, 3)) {
        let labQuery = supabase
          .from("labs")
          .select("id, name, slug, discount_percentage, cities")
          .eq("is_active", true)
          .ilike("name", `%${keyword}%`)
          .limit(5);
        
        const { data: labs } = await labQuery;
        
        if (labs) {
          for (const lab of labs) {
            if (cityFilter && lab.cities && !lab.cities.includes(cityFilter)) {
              continue;
            }
            if (!results.labs_tests.find(l => l.id === lab.id && l.type === "lab")) {
              results.labs_tests.push({
                id: lab.id,
                name: lab.name,
                type: "lab",
                slug: lab.slug,
                subtitle: lab.discount_percentage ? `Up to ${lab.discount_percentage}% Discount` : "Diagnostic Laboratory",
                relevance_score: calculateRelevance(lab.name, keywords),
              });
            }
          }
        }
      }
    }

    // Search Hospitals
    if (expandedQuery.categories_to_search.includes("hospitals")) {
      for (const keyword of keywords.slice(0, 5)) {
        let hospitalQuery = supabase
          .from("hospitals")
          .select("id, name, slug, city, specialties, departments")
          .eq("is_active", true)
          .or(`name.ilike.%${keyword}%,specialties.cs.{${keyword}},departments.cs.{${keyword}}`)
          .limit(10);
        
        if (cityFilter) {
          hospitalQuery = hospitalQuery.eq("city", cityFilter);
        }
        
        const { data: hospitals } = await hospitalQuery;
        
        if (hospitals) {
          for (const hospital of hospitals) {
            if (!results.hospitals.find(h => h.id === hospital.id)) {
              results.hospitals.push({
                id: hospital.id,
                name: hospital.name,
                type: "hospital",
                slug: hospital.slug,
                subtitle: hospital.city || "Hospital",
                relevance_score: calculateRelevance(hospital.name, keywords),
              });
            }
          }
        }
      }
    }

    // Search Nurses
    if (expandedQuery.categories_to_search.includes("nurses")) {
      for (const keyword of keywords.slice(0, 5)) {
        let nurseQuery = supabase
          .from("nurses")
          .select("id, full_name, qualification, city, services_offered")
          .eq("status", "approved")
          .or(`full_name.ilike.%${keyword}%,qualification.ilike.%${keyword}%`)
          .limit(10);
        
        if (cityFilter) {
          nurseQuery = nurseQuery.eq("city", cityFilter);
        }
        
        const { data: nurses } = await nurseQuery;
        
        if (nurses) {
          for (const nurse of nurses) {
            if (!results.nurses.find(n => n.id === nurse.id)) {
              results.nurses.push({
                id: nurse.id,
                name: nurse.full_name,
                type: "nurse",
                subtitle: `${nurse.qualification || "Nurse"}${nurse.city ? ` • ${nurse.city}` : ""}`,
                relevance_score: calculateRelevance(nurse.full_name + " " + (nurse.qualification || ""), keywords),
              });
            }
          }
        }
      }
    }

    // Search Surgeries
    if (expandedQuery.categories_to_search.includes("surgeries")) {
      for (const keyword of keywords.slice(0, 5)) {
        const { data: surgeries } = await supabase
          .from("surgeries")
          .select("id, name, slug, description, discount_percentage")
          .eq("is_active", true)
          .or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`)
          .limit(10);
        
        if (surgeries) {
          for (const surgery of surgeries) {
            if (!results.surgeries.find(s => s.id === surgery.id)) {
              results.surgeries.push({
                id: surgery.id,
                name: surgery.name,
                type: "surgery",
                slug: surgery.slug,
                subtitle: surgery.discount_percentage
                  ? `${surgery.discount_percentage}% Discount Available`
                  : "Surgical Procedure",
                relevance_score: calculateRelevance(surgery.name + " " + (surgery.description || ""), keywords),
              });
            }
          }
        }
      }
    }

    // Sort each category by relevance score
    Object.keys(results).forEach(key => {
      const category = key as keyof CategorizedResults;
      results[category].sort((a, b) => b.relevance_score - a.relevance_score);
      // Limit each category to top 10
      results[category] = results[category].slice(0, 10);
    });

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    return new Response(
      JSON.stringify({
        intent: expandedQuery.intent,
        expanded_keywords: expandedQuery.expanded_keywords,
        total_results: totalResults,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Intelligent search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
