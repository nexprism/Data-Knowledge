import React from "react";
import { Plus, X, Layout, Layers, CheckCircle, Sparkles, Target, GripVertical, Copy, Trash2, ArrowUp, ArrowDown, Shield } from "lucide-react";
import Editor from "../../components/Editor";

const generateId = () => Math.random().toString(36).substr(2, 9);

const sectionTemplates = {
    overview: {
        type: "overview",
        title: "Overview Section",
        icon: Layout,
        defaultData: { show: true, title: "", subtitle: "", description: null, images: [] }
    },
    comparison: {
        type: "comparison",
        title: "Comparison Section",
        icon: Layers,
        defaultData: { show: true, title: "", leftTitle: "Traditional Program", rightTitle: "Our Program", description: null, content: null, leftPoints: [""], rightPoints: [""] }
    },
    benefits: {
        type: "benefits",
        title: "Benefits Section",
        icon: CheckCircle,
        defaultData: { show: true, title: "", content: null, points: [""] }
    },
    framework: {
        type: "framework",
        title: "Framework Section",
        icon: Sparkles,
        defaultData: { show: true, title: "", subtitle: "", description: null, media: "" }
    },
    solution: {
        type: "solution",
        title: "Solution Section",
        icon: Target,
        defaultData: { show: true, title: "", content: null, points: [""], outcomeTitle: "", outcomeDescription: null, outcomePoints: [""], solutionTitle: "", solutionDescription: null }
    },
    guarantee: {
        type: "guarantee",
        title: "Guarantee Section",
        icon: Shield,
        defaultData: { show: true }
    }
};

export default function LandingPageSections({ formData, setFormData }: any) {
    // Sort by `order` field (matches DB schema) so display always reflects stored order
    const sections: any[] = [...(formData.landingPageSections || [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );

    /** Persist sections and re-stamp sequential `order` values to match DB schema */
    const updateSections = (newSections: any[]) => {
        const stamped = newSections.map((s, i) => ({ ...s, order: i, sortOrder: i }));
        setFormData({ ...formData, landingPageSections: stamped });
    };

    const addSection = (type: string) => {
        const template = sectionTemplates[type as keyof typeof sectionTemplates];
        const nextOrder = sections.length; // will be re-stamped by updateSections anyway
        updateSections([...sections, {
            id: generateId(),
            type,
            order: nextOrder,
            sortOrder: nextOrder,
            data: JSON.parse(JSON.stringify(template.defaultData))
        }]);
    };

    const updateSectionData = (index: number, newData: any) => {
        const newSections = sections.map((section, i) =>
            i === index ? { ...section, data: newData } : section
        );
        updateSections(newSections);
    };

    const duplicateSection = (index: number) => {
        const newSections = [...sections];
        const itemToClone = newSections[index];
        newSections.splice(index + 1, 0, {
            id: generateId(),
            type: itemToClone.type,
            order: index + 1,      // will be re-stamped sequentially by updateSections
            sortOrder: index + 1,
            data: JSON.parse(JSON.stringify(itemToClone.data))
        });
        updateSections(newSections); // re-stamps all order values
    };

    const removeSection = (index: number) => {
        const newSections = [...sections];
        newSections.splice(index, 1);
        updateSections(newSections);
    };

    const moveSection = (index: number, dir: number) => {
        if (index + dir < 0 || index + dir >= sections.length) return;
        const newSections = [...sections];
        const temp = newSections[index];
        newSections[index] = newSections[index + dir];
        newSections[index + dir] = temp;
        updateSections(newSections);
    };

    const onDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData("dragIndex", index.toString());
    };

    const onDrop = (e: React.DragEvent, index: number) => {
        const dragIndexStr = e.dataTransfer.getData("dragIndex");
        if (!dragIndexStr) return;
        const dragIndex = parseInt(dragIndexStr, 10);
        if (dragIndex === index) return;
        const newSections = [...sections];
        const item = newSections.splice(dragIndex, 1)[0];
        newSections.splice(index, 0, item);
        updateSections(newSections);
    };

    return (
        <div className="space-y-8 pb-10">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 border-b pb-2">Landing Page Customization</h3>

            {/* Existing Sections */}
            <div className="space-y-6">
                {sections.map((section, index) => {
                    const sTemplate = sectionTemplates[section.type as keyof typeof sectionTemplates];
                    const Icon = sTemplate?.icon || Layout;
                    const sData = section.data;
                    const secId = section.id || section._id || `sec-${index}`;

                    return (
                        <div
                            key={secId}
                            draggable
                            onDragStart={(e) => onDragStart(e, index)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => onDrop(e, index)}
                            className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-800 space-y-6 relative group"
                        >
                            {/* Drag Handle & Section Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                        <GripVertical className="w-5 h-5" />
                                    </div>
                                    <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                        <Icon className="w-5 h-5 text-blue-600" />
                                        {sTemplate?.title || "Section"}
                                    </h4>
                                </div>

                                <div className="flex items-center gap-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={sData.show}
                                            onChange={(e) => updateSectionData(index, { ...sData, show: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">Visible</span>
                                    </label>

                                    <div className="flex items-center border-l dark:border-gray-700 pl-4 gap-2">
                                        <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                                            <ArrowUp className="w-4 h-4" />
                                        </button>
                                        <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30">
                                            <ArrowDown className="w-4 h-4" />
                                        </button>
                                        <button type="button" onClick={() => duplicateSection(index)} className="p-1 text-gray-400 hover:text-green-600 ml-2" title="Duplicate">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button type="button" onClick={() => removeSection(index)} className="p-1 text-gray-400 hover:text-red-600" title="Delete">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {sData.show && (
                                <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                                    {/* OVERVIEW SECTION CONTENT */}
                                    {section.type === "overview" && (
                                        <>
                                            <input type="text" placeholder="Section Title (e.g., What is a Solopreneur?)" value={sData.title} onChange={(e) => updateSectionData(index, { ...sData, title: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" />
                                            <input type="text" placeholder="Subtitle" value={sData.subtitle} onChange={(e) => updateSectionData(index, { ...sData, subtitle: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" />
                                            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                                <Editor key={`overview-editor-${secId}`} holder={`overview-editor-${secId}`} data={sData.description} onChange={(data: any) => updateSectionData(index, { ...sData, description: data })} uploadEndpoint="/courses/images" />
                                            </div>
                                        </>
                                    )}

                                    {/* COMPARISON SECTION CONTENT */}
                                    {section.type === "comparison" && (
                                        <div className="space-y-6">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Section Title & Description</label>
                                                    <input type="text" placeholder="Section Title" value={sData.title} onChange={(e) => updateSectionData(index, { ...sData, title: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" />
                                                    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                                        <Editor key={`comparison-desc-${secId}`} holder={`comparison-desc-${secId}`} data={sData.description} onChange={(data: any) => updateSectionData(index, { ...sData, description: data })} uploadEndpoint="/courses/images" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* LEFT COLUMN */}
                                                <div className="space-y-4">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Left Column Title (Traditional Program)</label>
                                                    <input type="text" placeholder="Traditional Program" value={sData.leftTitle} onChange={(e) => updateSectionData(index, { ...sData, leftTitle: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" />
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mt-4">Left Column Points</label>
                                                    <div className="space-y-2">
                                                        {(sData.leftPoints?.length ? sData.leftPoints : []).map((point: any, pIndex: number) => (
                                                            <div key={pIndex} className="flex gap-2">
                                                                <input type="text" value={point} onChange={(e) => { const updated = [...sData.leftPoints]; updated[pIndex] = e.target.value; updateSectionData(index, { ...sData, leftPoints: updated }); }} className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Enter point" />
                                                                <button type="button" onClick={() => updateSectionData(index, { ...sData, leftPoints: sData.leftPoints.filter((_: any, i: number) => i !== pIndex) })} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><X className="w-4 h-4" /></button>
                                                            </div>
                                                        ))}
                                                        <button type="button" onClick={() => updateSectionData(index, { ...sData, leftPoints: [...(sData.leftPoints || []), ""] })} className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 hover:text-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Left Point</button>
                                                    </div>
                                                </div>
                                                {/* RIGHT COLUMN */}
                                                <div className="space-y-4">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Right Column Title (Our Program)</label>
                                                    <input type="text" placeholder="Our Program" value={sData.rightTitle} onChange={(e) => updateSectionData(index, { ...sData, rightTitle: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" />
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mt-4">Right Column Points</label>
                                                    <div className="space-y-2">
                                                        {(sData.rightPoints?.length ? sData.rightPoints : []).map((point: any, pIndex: number) => (
                                                            <div key={pIndex} className="flex gap-2">
                                                                <input type="text" value={point} onChange={(e) => { const updated = [...sData.rightPoints]; updated[pIndex] = e.target.value; updateSectionData(index, { ...sData, rightPoints: updated }); }} className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Enter point" />
                                                                <button type="button" onClick={() => updateSectionData(index, { ...sData, rightPoints: sData.rightPoints.filter((_: any, i: number) => i !== pIndex) })} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><X className="w-4 h-4" /></button>
                                                            </div>
                                                        ))}
                                                        <button type="button" onClick={() => updateSectionData(index, { ...sData, rightPoints: [...(sData.rightPoints || []), ""] })} className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 hover:text-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Right Point</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* BENEFITS SECTION CONTENT */}
                                    {section.type === "benefits" && (
                                        <>
                                            <input type="text" placeholder="Section Title" value={sData.title} onChange={(e) => updateSectionData(index, { ...sData, title: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" />
                                            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                                <Editor key={`benefit-editor-${secId}`} holder={`benefit-editor-${secId}`} data={sData.content} onChange={(data: any) => updateSectionData(index, { ...sData, content: data })} uploadEndpoint="/courses/images" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Key Benefits Points</label>
                                                <div className="space-y-2">
                                                    {(sData.points || [""]).map((point: any, pIndex: number) => (
                                                        <div key={pIndex} className="flex gap-2">
                                                            <input type="text" value={point} onChange={(e) => { const updated = [...(sData.points || [""])]; updated[pIndex] = e.target.value; updateSectionData(index, { ...sData, points: updated }); }} className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Enter benefit point" />
                                                            <button type="button" onClick={() => updateSectionData(index, { ...sData, points: (sData.points || [""]).filter((_: any, i: number) => i !== pIndex) })} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><X className="w-4 h-4" /></button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => updateSectionData(index, { ...sData, points: [...(sData.points || [""]), ""] })} className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 hover:text-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Benefit Point</button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* FRAMEWORK SECTION CONTENT */}
                                    {section.type === "framework" && (
                                        <>
                                            <input type="text" placeholder="Section Title (e.g., Making $2000/month is Easy)" value={sData.title} onChange={(e) => updateSectionData(index, { ...sData, title: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" />
                                            <input type="text" placeholder="Subtitle (e.g., Exact Frameworks that works)" value={sData.subtitle} onChange={(e) => updateSectionData(index, { ...sData, subtitle: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" />
                                            <input type="text" placeholder="Media URL (Image or Video)" value={sData.media} onChange={(e) => updateSectionData(index, { ...sData, media: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" />
                                            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                                <Editor key={`framework-editor-${secId}`} holder={`framework-editor-${secId}`} data={sData.description} onChange={(data: any) => updateSectionData(index, { ...sData, description: data })} uploadEndpoint="/courses/images" />
                                            </div>
                                        </>
                                    )}

                                    {/* SOLUTION SECTION CONTENT */}
                                    {section.type === "solution" && (
                                        <>
                                            <input type="text" placeholder="Section Title (e.g., Solve Your Biggest Problems)" value={sData.title} onChange={(e) => updateSectionData(index, { ...sData, title: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" />
                                            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 px-4 pt-4">Main Content</label>
                                                <Editor key={`solution-editor-${secId}`} holder={`solution-editor-${secId}`} data={sData.content} onChange={(data: any) => updateSectionData(index, { ...sData, content: data })} uploadEndpoint="/courses/images" />
                                            </div>
                                            <div className="mb-8 p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white/30 dark:bg-gray-800/30">
                                                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Phase 1: What we Solve (Challenges)</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="Enter heading for challenges (e.g. Problems we solve)" 
                                                    value={sData.outcomeTitle || ""} 
                                                    onChange={(e) => updateSectionData(index, { ...sData, outcomeTitle: e.target.value })} 
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-4 dark:bg-gray-800 dark:text-gray-200" 
                                                />
                                                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 mb-4">
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-3 pt-2 text-transform: uppercase">Challenge Description</label>
                                                    <Editor key={`outcome-desc-editor-${secId}`} holder={`outcome-desc-editor-${secId}`} data={sData.outcomeDescription} onChange={(data: any) => updateSectionData(index, { ...sData, outcomeDescription: data })} uploadEndpoint="/courses/images" />
                                                </div>
                                                <div className="space-y-2">
                                                    {(sData.outcomePoints || [""]).map((point: any, pIndex: number) => (
                                                        <div key={pIndex} className="flex gap-2">
                                                            <input 
                                                                type="text" 
                                                                value={point} 
                                                                onChange={(e) => { 
                                                                    const updated = [...(sData.outcomePoints || [""])]; 
                                                                    updated[pIndex] = e.target.value; 
                                                                    updateSectionData(index, { ...sData, outcomePoints: updated }); 
                                                                }} 
                                                                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" 
                                                                placeholder="Enter challenge point" 
                                                            />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => updateSectionData(index, { ...sData, outcomePoints: (sData.outcomePoints || [""]).filter((_: any, i: number) => i !== pIndex) })} 
                                                                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button 
                                                        type="button" 
                                                        onClick={() => updateSectionData(index, { ...sData, outcomePoints: [...(sData.outcomePoints || [""]), ""] })} 
                                                        className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 hover:text-black flex items-center justify-center gap-2"
                                                    >
                                                        <Plus className="w-4 h-4" /> Add Challenge Point
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-8 p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-white/30 dark:bg-gray-800/30">
                                                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Phase 2: Solutions (Program Outcomes)</label>
                                                <input 
                                                    type="text" 
                                                    placeholder="By Program's End, You'll Have" 
                                                    value={sData.solutionTitle || ""} 
                                                    onChange={(e) => updateSectionData(index, { ...sData, solutionTitle: e.target.value })} 
                                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 mb-4 dark:bg-gray-800 dark:text-gray-200" 
                                                />
                                                <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 mb-4">
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-3 pt-2 text-transform: uppercase">Solution Description</label>
                                                    <Editor key={`solution-desc-editor-${secId}`} holder={`solution-desc-editor-${secId}`} data={sData.solutionDescription} onChange={(data: any) => updateSectionData(index, { ...sData, solutionDescription: data })} uploadEndpoint="/courses/images" />
                                                </div>
                                                <div className="space-y-2">
                                                    {(sData.points || [""]).map((point: any, pIndex: number) => (
                                                        <div key={pIndex} className="flex gap-2">
                                                            <input type="text" value={point} onChange={(e) => { const updated = [...(sData.points || [""])]; updated[pIndex] = e.target.value; updateSectionData(index, { ...sData, points: updated }); }} className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 dark:bg-gray-800 dark:text-gray-200" placeholder="Enter solution point" />
                                                            <button type="button" onClick={() => updateSectionData(index, { ...sData, points: (sData.points || [""]).filter((_: any, i: number) => i !== pIndex) })} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><X className="w-4 h-4" /></button>
                                                        </div>
                                                    ))}
                                                    <button type="button" onClick={() => updateSectionData(index, { ...sData, points: [...(sData.points || [""]), ""] })} className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 hover:text-black flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add Solution Point</button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Add new section block */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 mt-6 text-center">
                <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Add New Landing Page Section</h4>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <button type="button" onClick={() => addSection('overview')} className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 flex items-center gap-2"><Layout className="w-4 h-4" /> Overview</button>
                    <button type="button" onClick={() => addSection('comparison')} className="px-4 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-100 flex items-center gap-2"><Layers className="w-4 h-4" /> Comparison</button>
                    <button type="button" onClick={() => addSection('benefits')} className="px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Benefits</button>
                    <button type="button" onClick={() => addSection('framework')} className="px-4 py-2 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-lg hover:bg-yellow-100 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Framework</button>
                    <button type="button" onClick={() => addSection('solution')} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 flex items-center gap-2"><Target className="w-4 h-4" /> Solution</button>
                    <button type="button" onClick={() => addSection('guarantee')} className="px-4 py-2 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-100 flex items-center gap-2"><Shield className="w-4 h-4" /> Guarantee</button>
                </div>
            </div>
        </div>
    );
}
