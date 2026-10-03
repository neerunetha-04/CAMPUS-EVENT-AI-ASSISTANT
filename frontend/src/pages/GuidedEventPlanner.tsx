import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Cpu, 
  DollarSign, 
  ShieldAlert, 
  FileCheck2, 
  AlertTriangle, 
  BookOpen, 
  CheckCircle2, 
  Save, 
  Sparkles,
  Info
} from 'lucide-react';
import { EventData, MissingField } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { CitationDrawer } from '../components/CitationDrawer';

interface GuidedEventPlannerProps {
  onComplete: (eventId: string) => void;
  onCancel: () => void;
}

export const GuidedEventPlanner: React.FC<GuidedEventPlannerProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<EventData>>({
    name: '',
    event_type: 'Workshop',
    category: 'Academic',
    organizing_department: '',
    organizer_name: '',
    organizer_role: 'Lead Coordinator',
    contact_email: '',
    contact_phone: '',

    event_date: '',
    start_time: '10:00',
    end_time: '16:00',
    setup_time: '08:30',
    cleanup_time: '17:30',

    preferred_venue: '',
    indoor_outdoor: 'indoor',
    expected_occupancy: 150,
    seating_arrangement: 'theater',
    multiple_venues: false,
    expected_attendance: 100,
    student_participants: true,
    faculty_participants: true,
    external_participants: false,
    has_external_guests: false,
    has_vips: false,
    has_speakers: false,
    has_performers: false,
    guest_details: '',

    audio_system: true,
    projector: true,
    lighting: false,
    stage: false,
    internet: true,
    electrical_equipment: false,
    furniture: false,
    photography: false,
    video_recording: false,
    catering: false,
    transportation: false,
    security: false,
    medical_support: false,
    resource_notes: '',

    estimated_budget: 0,
    funding_source: 'Department Funding',
    has_sponsorship: false,
    sponsorship_details: '',
    registration_fee: 0,

    external_visitors: false,
    overnight_activity: false,
    food_served: false,
    fire_electrical_equipment: false,
    large_crowd: false,
    outdoor_activity: false,
    sensitive_equipment: false,
    special_permissions: ''
  });

  const [activeCitation, setActiveCitation] = useState<any>(null);

  const steps = [
    { number: 1, title: 'Overview', icon: FileCheck2 },
    { number: 2, title: 'Schedule', icon: Calendar },
    { number: 3, title: 'Venue', icon: MapPin },
    { number: 4, title: 'Resources', icon: Cpu },
    { number: 5, title: 'Budget', icon: DollarSign },
    { number: 6, title: 'Special', icon: ShieldAlert },
    { number: 7, title: 'Analysis', icon: Sparkles },
    { number: 8, title: 'Checklist', icon: CheckCircle2 },
    { number: 9, title: 'Conflicts', icon: AlertTriangle },
    { number: 10, title: 'Summary', icon: BookOpen }
  ];

  // Dynamic Rule Analysis derived locally in real time
  const getDynamicRules = () => {
    const rules = [];
    const missing: MissingField[] = [];

    // Check missing
    if (!formData.name) {
      missing.push({
        field_key: 'name',
        label: 'Event Name',
        step: 1,
        step_name: 'Overview',
        importance: 'Critical',
        reason: 'Every formal institutional requisition requires an explicit title for administrative records.'
      });
    }
    if (!formData.event_date) {
      missing.push({
        field_key: 'event_date',
        label: 'Event Date',
        step: 2,
        step_name: 'Schedule',
        importance: 'Critical',
        reason: 'Institutional policies enforce 14-day advance booking windows. Timeline compliance cannot be verified without a date.'
      });
    }
    if (!formData.preferred_venue) {
      missing.push({
        field_key: 'preferred_venue',
        label: 'Preferred Venue',
        step: 3,
        step_name: 'Venue',
        importance: 'Critical',
        reason: 'Capacity and facility regulations are strictly venue-specific.'
      });
    }
    if (!formData.organizing_department) {
      missing.push({
        field_key: 'organizing_department',
        label: 'Organizing Department / Club',
        step: 1,
        step_name: 'Overview',
        importance: 'Critical',
        reason: 'Official approvals require a recognized academic department or student club sponsor.'
      });
    }

    // Dynamic requirements based on current inputs
    rules.push({
      title: 'Event Permission Form Submission',
      type: 'Mandatory',
      trigger: 'Universal Requirement',
      source: 'DEMO DOCUMENT: Student Club & Activity Regulations (v3.1)',
      deadline: '14 business days prior',
      excerpt: 'All student club events, workshops, technical competitions, and cultural celebrations require prior institutional authorization.'
    });

    if (formData.preferred_venue) {
      rules.push({
        title: `Facilities Requisition: ${formData.preferred_venue}`,
        type: 'Mandatory',
        trigger: `Venue: ${formData.preferred_venue}`,
        source: 'DEMO DOCUMENT: Auditorium & Campus Venue Booking Policy (v2.0)',
        deadline: 'At least 14 days prior',
        excerpt: 'Venue booking requisitions for the Main Auditorium and halls must be submitted at least 14 days prior to the proposed event date.'
      });
    }

    if (formData.has_external_guests || formData.has_speakers || formData.has_vips) {
      rules.push({
        title: 'External Speaker & Guest Clearance Protocol',
        type: 'Conditional',
        trigger: 'External guests / dignitaries invited',
        source: 'DEMO DOCUMENT: Student Club & Activity Regulations (v3.1)',
        deadline: '10 business days prior',
        excerpt: 'Whenever an event involves external speakers, political dignitaries, corporate VIPs, or non-campus performers, submit CV and outline to Dean of Student Affairs.'
      });
    }

    const attendance = formData.expected_attendance || 0;
    if (attendance >= 200 || formData.large_crowd) {
      rules.push({
        title: 'Crowd Safety Plan & Security Marshal Assignment',
        type: 'Conditional',
        trigger: `Attendance (${attendance}) exceeds crowd threshold (200+)`,
        source: 'DEMO DOCUMENT: Campus Safety, Crowd Management & Fire Rules (v1.5)',
        deadline: '5 business days prior',
        excerpt: 'Events with attendance exceeding 200 participants require certified student marshals and Campus Security officers assigned to entrance vestibules.'
      });
    }

    if (formData.catering || formData.food_served) {
      rules.push({
        title: 'Food Handling & Licensed Caterer Clearance',
        type: 'Conditional',
        trigger: 'Food / Catering indicated',
        source: 'DEMO DOCUMENT: Institutional Finance, Sponsorship & Catering Rules (v1.0)',
        deadline: '7 days prior',
        excerpt: 'All food and refreshments provided during campus gatherings must be procured through university-approved catering contractors.'
      });
    }

    if (formData.electrical_equipment || formData.stage || formData.lighting) {
      rules.push({
        title: 'Electrical Load & Technical Rigging Clearance',
        type: 'Conditional',
        trigger: 'High-power AV or stage equipment',
        source: 'DEMO DOCUMENT: Auditorium & Campus Venue Booking Policy (v2.0)',
        deadline: '48 hours prior',
        excerpt: 'Any event requiring stage rigging or heavy electrical equipment must obtain written technical clearance from the Facilities Electrical Engineer.'
      });
    }

    if (formData.overnight_activity) {
      rules.push({
        title: 'Special Overnight Activity Permit',
        type: 'Conditional',
        trigger: 'Curfew / overnight operation',
        source: 'DEMO DOCUMENT: Student Club & Activity Regulations (v3.1)',
        deadline: '10 business days prior',
        excerpt: 'Any student event extending beyond the standard campus curfew hours (22:00 / 10:00 PM) requires a Special Overnight Permit approved by the Dean of Student Affairs.'
      });
    }

    return { rules, missing };
  };

  const { rules: dynamicRules, missing: missingFields } = getDynamicRules();

  const handleInputChange = (field: keyof EventData, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleSaveAndAnalyze = async () => {
    if (!formData.name) {
      alert('Please provide an Event Name before finalizing.');
      return;
    }
    try {
      setSaving(true);
      const created = await api.createEvent(formData);
      setCreatedEventId(created.id);
      onComplete(created.id);
    } catch (err: any) {
      alert(`Error saving event: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header & Steps Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Guided Campus Event Intake
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Step {currentStep} of {steps.length} — {steps[currentStep - 1].title}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Stepper bar */}
        <div className="hidden sm:flex items-center justify-between bg-[#111a2e] border border-[#1e2c47] rounded-xl p-2 overflow-x-auto">
          {steps.map((s) => {
            const Icon = s.icon;
            const isCompleted = s.number < currentStep;
            const isCurrent = s.number === currentStep;
            return (
              <button
                key={s.number}
                onClick={() => setCurrentStep(s.number)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isCurrent 
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' 
                    : isCompleted 
                    ? 'text-teal-400 hover:bg-slate-800' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  isCurrent ? 'bg-cyan-500 text-black font-bold' : isCompleted ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : s.number}
                </div>
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Intake Form (7 cols) */}
        <div className="lg:col-span-7 bg-[#111a2e] border border-[#1e2c47] rounded-xl p-6 shadow-md space-y-6">
          
          {/* STEP 1: Overview */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e2c47] pb-3">
                <FileCheck2 className="w-5 h-5 text-cyan-400" />
                Step 1: Event Overview
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Event Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. AI & Robotics Annual Symposium 2026"
                  className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Event Type</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => handleInputChange('event_type', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Conference">Conference / Symposium</option>
                    <option value="Guest Lecture">Guest Lecture</option>
                    <option value="Cultural Fest">Cultural Festival</option>
                    <option value="Sports Tournament">Sports Tournament</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Exhibition">Exhibition / Project Expo</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="Academic">Academic Departmental</option>
                    <option value="Student Activity">Recognized Student Club</option>
                    <option value="Administrative">Institutional Administrative</option>
                    <option value="External">External Collaboration</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Organizing Department or Club <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.organizing_department || ''}
                  onChange={(e) => handleInputChange('organizing_department', e.target.value)}
                  placeholder="e.g. Department of Computer Science / Robotics Club"
                  className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Organizer Name</label>
                  <input
                    type="text"
                    value={formData.organizer_name || ''}
                    onChange={(e) => handleInputChange('organizer_name', e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.contact_email || ''}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    placeholder="e.g. alex.rivera@university.edu"
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Schedule */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e2c47] pb-3">
                <Calendar className="w-5 h-5 text-cyan-400" />
                Step 2: Date & Schedule
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Event Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={formData.event_date || ''}
                  onChange={(e) => handleInputChange('event_date', e.target.value)}
                  className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Institutional rules require at least 14 days advance booking for premier facilities.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.start_time || '10:00'}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.end_time || '16:00'}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Setup Time</label>
                  <input
                    type="time"
                    value={formData.setup_time || '08:30'}
                    onChange={(e) => handleInputChange('setup_time', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Cleanup Time</label>
                  <input
                    type="time"
                    value={formData.cleanup_time || '17:30'}
                    onChange={(e) => handleInputChange('cleanup_time', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Venue & Attendance */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e2c47] pb-3">
                <MapPin className="w-5 h-5 text-cyan-400" />
                Step 3: Venue & Attendance
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Preferred Venue <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formData.preferred_venue || ''}
                    onChange={(e) => handleInputChange('preferred_venue', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="">-- Select Venue --</option>
                    <option value="Main University Auditorium">Main University Auditorium (Cap: 800)</option>
                    <option value="Science Seminar Hall A">Science Seminar Hall A (Cap: 250)</option>
                    <option value="Open Air Amphitheater">Open Air Amphitheater (Cap: 1200)</option>
                    <option value="Multi-Purpose Indoor Arena">Multi-Purpose Indoor Arena</option>
                    <option value="Student Center Conference Room">Student Center Conference Room (Cap: 80)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Expected Attendance <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.expected_attendance || ''}
                    onChange={(e) => handleInputChange('expected_attendance', parseInt(e.target.value) || 0)}
                    placeholder="e.g. 250"
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Attendance over 200 triggers security marshals; over 500 triggers fire marshal inspection.
                  </p>
                </div>
              </div>

              {/* Guest Flags */}
              <div className="p-4 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg space-y-3">
                <span className="text-xs font-semibold text-slate-200 block">Dignitary & Guest Participation</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_external_guests}
                      onChange={(e) => handleInputChange('has_external_guests', e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-0"
                    />
                    External Guests
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_speakers}
                      onChange={(e) => handleInputChange('has_speakers', e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-0"
                    />
                    Guest Speakers
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_vips}
                      onChange={(e) => handleInputChange('has_vips', e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-0"
                    />
                    VIPs / Dignitaries
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.has_performers}
                      onChange={(e) => handleInputChange('has_performers', e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-0"
                    />
                    Performers
                  </label>
                </div>

                {(formData.has_external_guests || formData.has_speakers || formData.has_vips) && (
                  <div className="pt-2">
                    <label className="text-xs font-medium text-amber-300 block mb-1">
                      Guest Bios / Speaker Topics (Required for clearance)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.guest_details || ''}
                      onChange={(e) => handleInputChange('guest_details', e.target.value)}
                      placeholder="List external speakers, current affiliations, and planned discussion topics..."
                      className="w-full px-3 py-2 bg-[#111a2e] border border-amber-500/30 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Resources */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e2c47] pb-3">
                <Cpu className="w-5 h-5 text-cyan-400" />
                Step 4: Resources & Facilities
              </h2>

              <p className="text-xs text-slate-400">
                Select required institutional facilities. Specialized AV and electrical infrastructure trigger safety inspection workflows.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                {[
                  { key: 'audio_system', label: 'Audio / PA System' },
                  { key: 'projector', label: 'Digital Projector & Screen' },
                  { key: 'lighting', label: 'Stage Lighting Rig' },
                  { key: 'stage', label: 'Raised Platform / Stage' },
                  { key: 'internet', label: 'High-Speed Campus WiFi' },
                  { key: 'electrical_equipment', label: 'Heavy Electrical Cabling' },
                  { key: 'furniture', label: 'Extra Tables & Chairs' },
                  { key: 'photography', label: 'Media Photography' },
                  { key: 'video_recording', label: 'Live Video Stream' },
                  { key: 'catering', label: 'Food / Catering Setup' },
                  { key: 'security', label: 'Dedicated Security Guard' },
                  { key: 'medical_support', label: 'Paramedic / First Aid' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 p-2.5 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg cursor-pointer hover:border-cyan-500/30">
                    <input
                      type="checkbox"
                      checked={!!(formData as any)[item.key]}
                      onChange={(e) => handleInputChange(item.key as any, e.target.checked)}
                      className="rounded text-cyan-500 focus:ring-0"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Budget & Funding */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e2c47] pb-3">
                <DollarSign className="w-5 h-5 text-cyan-400" />
                Step 5: Budget & Funding
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Estimated Budget ($)</label>
                  <input
                    type="number"
                    value={formData.estimated_budget || ''}
                    onChange={(e) => handleInputChange('estimated_budget', parseFloat(e.target.value) || 0)}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Funding Source</label>
                  <select
                    value={formData.funding_source || ''}
                    onChange={(e) => handleInputChange('funding_source', e.target.value)}
                    className="w-full px-3 py-2 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-sm text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="Department Funding">Departmental Grant</option>
                    <option value="Student Club Budget">Student Activity Fee Allocation</option>
                    <option value="Corporate Sponsorship">Corporate Sponsorship</option>
                    <option value="Ticket Revenue">Registration / Ticket Sales</option>
                    <option value="Self-Funded">Self-Funded</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.has_sponsorship}
                    onChange={(e) => handleInputChange('has_sponsorship', e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                  Event includes external corporate sponsorship or brand partnership
                </label>
                {formData.has_sponsorship && (
                  <div>
                    <label className="text-xs font-medium text-purple-300 block mb-1">
                      Sponsor details (Subject to Institutional Finance clearance)
                    </label>
                    <input
                      type="text"
                      value={formData.sponsorship_details || ''}
                      onChange={(e) => handleInputChange('sponsorship_details', e.target.value)}
                      placeholder="Company names, monetary contribution, logo placement..."
                      className="w-full px-3 py-2 bg-[#111a2e] border border-purple-500/30 rounded-lg text-xs text-white"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Special Requirements */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e2c47] pb-3">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                Step 6: Special Operational Circumstances
              </h2>

              <p className="text-xs text-slate-400">
                These conditions invoke specialized institutional circulars (curfew waivers, food safety permits, crowd management).
              </p>

              <div className="space-y-3 text-xs text-slate-300">
                <label className="flex items-start gap-3 p-3 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.overnight_activity}
                    onChange={(e) => handleInputChange('overnight_activity', e.target.checked)}
                    className="mt-0.5 rounded text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">Overnight / Post-Curfew Activity</span>
                    <span className="text-slate-400 text-[11px]">Event will run past 22:00 (10 PM). Requires written Provost / Dean waiver.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.food_served}
                    onChange={(e) => handleInputChange('food_served', e.target.checked)}
                    className="mt-0.5 rounded text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">Food or Beverage Handling</span>
                    <span className="text-slate-400 text-[11px]">Refreshments will be served to guests. Requires health-licensed vendor compliance.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.large_crowd}
                    onChange={(e) => handleInputChange('large_crowd', e.target.checked)}
                    className="mt-0.5 rounded text-cyan-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-slate-200 block">Anticipated Large Crowd (&gt;200)</span>
                    <span className="text-slate-400 text-[11px]">High density gathering requires security marshal staffing and medical standby.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* STEP 7: Analysis Breakdown */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e2c47] pb-3">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Step 7: Automated Document Analysis
              </h2>

              <div className="p-4 bg-cyan-950/20 border border-cyan-800/40 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  Corpus Cross-Referencing Complete
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your event parameters have been cross-referenced with the active institutional policy corpus. Requirements have been split into Mandatory submissions, Conditional protocols, and Optional suggestions.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[#0a0f1d] border border-rose-500/20 rounded-lg">
                  <span className="text-xl font-bold text-rose-400 block">
                    {dynamicRules.filter(r => r.type === 'Mandatory').length}
                  </span>
                  <span className="text-[11px] text-slate-400">Mandatory Rules</span>
                </div>
                <div className="p-3 bg-[#0a0f1d] border border-purple-500/20 rounded-lg">
                  <span className="text-xl font-bold text-purple-400 block">
                    {dynamicRules.filter(r => r.type === 'Conditional').length}
                  </span>
                  <span className="text-[11px] text-slate-400">Conditional Rules</span>
                </div>
                <div className="p-3 bg-[#0a0f1d] border border-amber-500/20 rounded-lg">
                  <span className="text-xl font-bold text-amber-400 block">
                    {missingFields.length}
                  </span>
                  <span className="text-[11px] text-slate-400">Missing Fields</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Preview Checklist */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e2c47] pb-3">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                Step 8: Synthesized Procedural Checklist
              </h2>

              <div className="space-y-3">
                {dynamicRules.map((rule, idx) => (
                  <div key={idx} className="p-3 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{rule.title}</span>
                      <StatusBadge status={rule.type} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      <strong>Trigger:</strong> {rule.trigger} • <strong>Deadline:</strong> {rule.deadline}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-cyan-400 pt-1">
                      <span>Source: {rule.source}</span>
                      <button
                        onClick={() => setActiveCitation({
                          document_title: rule.source,
                          version: 'v2.0',
                          authority: 'University Administration',
                          section: 'Procedures',
                          excerpt: rule.excerpt
                        })}
                        className="underline hover:text-cyan-300"
                      >
                        View Excerpt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 9: Conflicts */}
          {currentStep === 9 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e2c47] pb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Step 9: Policy Discrepancy & Precedence
              </h2>

              <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
                  <Info className="w-4 h-4 text-amber-400" />
                  Precedence Resolution Applied
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The legacy <em>Venue Usage Circular v1.0</em> previously specified 7 days notice. However, the ratified <em>Auditorium Policy v2.0</em> establishes 14 days notice. CampusFlow enforces the 14-day rule because Policy v2.0 supersedes Circular v1.0.
                </p>
              </div>
            </div>
          )}

          {/* STEP 10: Final Readiness Summary */}
          {currentStep === 10 && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-[#1e2c47] pb-3">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                Step 10: Event Readiness Review
              </h2>

              <div className="p-5 bg-gradient-to-br from-[#131f37] to-[#0d1627] border border-[#1e2d4d] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{formData.name || 'Untitled Event'}</h3>
                    <p className="text-xs text-slate-400">
                      {formData.organizing_department} • {formData.event_date || 'Date Pending'}
                    </p>
                  </div>
                  <StatusBadge 
                    status={missingFields.length > 0 ? 'Needs Information' : 'Ready for Submission'} 
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#1e2c47]">
                  <div className="text-xs">
                    <span className="text-slate-400 block">Mandatory</span>
                    <span className="font-semibold text-rose-300">{dynamicRules.filter(r => r.type === 'Mandatory').length}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400 block">Conditional</span>
                    <span className="font-semibold text-purple-300">{dynamicRules.filter(r => r.type === 'Conditional').length}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400 block">Missing Critical</span>
                    <span className="font-semibold text-amber-300">{missingFields.length}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-slate-400 block">Verified Sources</span>
                    <span className="font-semibold text-cyan-300">4</span>
                  </div>
                </div>
              </div>

              {missingFields.length > 0 && (
                <div className="p-3 bg-amber-950/20 border border-amber-800/30 rounded-lg text-xs text-amber-300 space-y-1">
                  <span className="font-semibold block">Planning cannot be finalized yet:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    {missingFields.map((m, idx) => (
                      <li key={idx}><strong>{m.label}:</strong> {m.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#1e2c47]">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className={`px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                currentStep === 1 ? 'opacity-40 cursor-not-allowed text-slate-500' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentStep < 10 ? (
              <button
                onClick={() => setCurrentStep(Math.min(10, currentStep + 1))}
                className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-white text-xs font-semibold rounded-lg shadow-md shadow-cyan-950/40 flex items-center gap-1.5 transition-all"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSaveAndAnalyze}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition-all"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Creating Workspace...' : 'Initialize Event Workspace'}
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Live Assistant Panel (5 cols) */}
        <div className="lg:col-span-5 bg-[#111a2e] border border-[#1e2c47] rounded-xl p-5 shadow-md space-y-5 sticky top-20">
          
          <div className="flex items-center justify-between border-b border-[#1e2c47] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
              <h3 className="text-sm font-bold text-white tracking-tight">Live Planning Assistant</h3>
            </div>
            <span className="text-[10px] text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              Real-Time Analysis
            </span>
          </div>

          {/* Missing Information Tracker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Missing Information</span>
              <span className={`text-[11px] font-bold ${missingFields.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {missingFields.length} pending
              </span>
            </div>

            {missingFields.length === 0 ? (
              <div className="p-3 bg-emerald-950/20 border border-emerald-800/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>All critical institutional parameters specified.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {missingFields.map((m, idx) => (
                  <div key={idx} className="p-2.5 bg-[#0a0f1d] border border-amber-500/20 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-amber-300">{m.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/10 text-amber-400 rounded">
                        Step {m.step}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{m.reason}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Triggered Requirements */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">Applicable Requirements ({dynamicRules.length})</span>
              <span className="text-[11px] text-slate-400">Grounded in Corpus</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {dynamicRules.map((rule, idx) => (
                <div key={idx} className="p-2.5 bg-[#0a0f1d] border border-[#1e2c47] rounded-lg text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-200 line-clamp-1">{rule.title}</span>
                    <StatusBadge status={rule.type} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Due: {rule.deadline}</span>
                    <button
                      onClick={() => setActiveCitation({
                        document_title: rule.source,
                        version: 'v2.0',
                        authority: 'University Administration',
                        section: 'Procedures',
                        excerpt: rule.excerpt
                      })}
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Source Citation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anti-Hallucination Assurance */}
          <div className="p-3 bg-[#0a0f1d] border border-cyan-500/20 rounded-lg flex items-start gap-2 text-[11px] text-slate-400">
            <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Every item shown is tied to active institutional policies. Rules adapt dynamically as you configure venue, attendance, and resources.
            </span>
          </div>
        </div>

      </div>

      {/* Citation Drawer */}
      <CitationDrawer
        citation={activeCitation}
        onClose={() => setActiveCitation(null)}
      />

    </div>
  );
};
