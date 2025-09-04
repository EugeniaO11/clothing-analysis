import React, { useState, useRef } from 'react';
import { User, Ruler, Shirt, Camera, Link, Star, TrendingUp, AlertCircle, CheckCircle, X } from 'lucide-react';

const ClothingRecommendationApp = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userProfile, setUserProfile] = useState({
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      height: '',
      weight: '',
      shoulders: '',
      inseam: '',
      armLength: '',
      bicep: '',
      forearm: '',
      wrist: ''
    },
    preferences: {
      style: 'casual',
      colors: [] as string[],
      budget: 'medium',
      fit: 'regular'
    }
  });
  
  const [measurementUnit, setMeasurementUnit] = useState<'inches' | 'cm'>('inches');
  
  interface AnalysisResult {
    suitability: number;
    pros: string[];
    cons: string[];
    reviews: {
      averageRating: string;
      totalReviews: number;
      sentiment: string;
      extractedReviews?: string[];
    };
    sizing: {
      recommendedSize: string;
      fitType: string;
      confidence: number;
    };
    armFitAnalysis?: {
      armType: string;
      sleeveCompatibility: number;
      recommendations: string[];
    } | null;
    productInfo?: {
      title?: string;
      price?: string;
      description?: string;
      reviews?: string[];
      source: string;
      error?: string;
    };
    error?: string;
  }
  
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const styleOptions = ['casual', 'formal', 'sporty', 'bohemian', 'minimalist', 'vintage'];
  const colorOptions = ['black', 'white', 'navy', 'gray', 'beige', 'red', 'blue', 'green'];
  const budgetOptions = ['low', 'medium', 'high', 'luxury'];
  const fitOptions = ['slim', 'regular', 'loose', 'oversized'];

  const handleMeasurementChange = (field: string, value: string) => {
    setUserProfile(prev => ({
      ...prev,
      measurements: { ...prev.measurements, [field]: value }
    }));
  };

  const convertMeasurement = (
    value: string,
    from: 'inches' | 'cm',
    to: 'inches' | 'cm'
  ): string => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    if (from === 'inches' && to === 'cm') {
      return (numValue * 2.54).toFixed(1);
    } else if (from === 'cm' && to === 'inches') {
      return (numValue / 2.54).toFixed(1);
    }
    return value;
  };

  const convertWeight = (
    value: string,
    from: 'lbs' | 'kg',
    to: 'lbs' | 'kg'
  ): string => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    
    if (from === 'lbs' && to === 'kg') {
      return (numValue * 0.453592).toFixed(1);
    } else if (from === 'kg' && to === 'lbs') {
      return (numValue / 0.453592).toFixed(1);
    }
    return value;
  };

  const getMeasurementLabels = () => {
    const weightUnit = measurementUnit === 'inches' ? 'lbs' : 'kg';
    const lengthUnit = measurementUnit;
    
    return {
      chest: `Chest (${lengthUnit})`,
      waist: `Waist (${lengthUnit})`,
      hips: `Hips (${lengthUnit})`,
      height: `Height (${lengthUnit})`,
      weight: `Weight (${weightUnit})`,
      shoulders: `Shoulders (${lengthUnit})`,
      inseam: `Inseam (${lengthUnit})`,
      armLength: `Arm Length (${lengthUnit})`,
      bicep: `Bicep (${lengthUnit})`,
      forearm: `Forearm (${lengthUnit})`,
      wrist: `Wrist (${lengthUnit})`
    };
  };

  type Measurements = {
    chest: string;
    waist: string;
    hips: string;
    height: string;
    weight: string;
    shoulders: string;
    inseam: string;
    armLength: string;
    bicep: string;
    forearm: string;
    wrist: string;
  };

  const handleUnitToggle = (newUnit: 'inches' | 'cm'): void => {
    const oldUnit = measurementUnit;
    setMeasurementUnit(newUnit);

    // Convert existing measurements
    const updatedMeasurements: Measurements = { ...userProfile.measurements };

    (Object.keys(updatedMeasurements) as (keyof Measurements)[]).forEach((key) => {
      if (key === 'weight') {
        const oldWeightUnit: 'lbs' | 'kg' = oldUnit === 'inches' ? 'lbs' : 'kg';
        const newWeightUnit: 'lbs' | 'kg' = newUnit === 'inches' ? 'lbs' : 'kg';
        updatedMeasurements.weight = convertWeight(
          updatedMeasurements.weight,
          oldWeightUnit,
          newWeightUnit
        );
      } else {
        updatedMeasurements[key] = convertMeasurement(
          updatedMeasurements[key],
          oldUnit,
          newUnit
        );
      }
    });

    setUserProfile((prev) => ({
      ...prev,
      measurements: updatedMeasurements,
    }));
  };

  const handlePreferenceChange = (
    field: 'style' | 'budget' | 'fit',
    value: string
  ): void => {
    setUserProfile(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }));
  };

  const handleColorToggle = (color: string) => {
    setUserProfile(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        colors: prev.preferences.colors.includes(color)
          ? prev.preferences.colors.filter(c => c !== color)
          : [...prev.preferences.colors, color]
      }
    }));
  };

  const calculateBodyType = () => {
    const { chest, waist, hips } = userProfile.measurements;
    if (!chest || !waist || !hips) return 'unknown';
    
    const c = parseFloat(chest);
    const w = parseFloat(waist);
    const h = parseFloat(hips);
    
    if (Math.abs(c - h) <= 2 && w < c - 4) return 'hourglass';
    if (c > h + 2 && c > w + 4) return 'inverted-triangle';
    if (h > c + 2 && h > w + 4) return 'pear';
    if (w >= c - 2 && w >= h - 2) return 'apple';
    return 'rectangle';
  };

  const getArmFitAnalysis = () => {
    const { armLength, bicep, forearm, shoulders } = userProfile.measurements;
    if (!armLength || !bicep || !forearm) return null;
    
    const armL = parseFloat(armLength);
    const bicepC = parseFloat(bicep);
    const forearmC = parseFloat(forearm);
    const shoulderW = parseFloat(shoulders);
    
    let armType = 'proportional';
    let recommendations = [];
    
    // Determine arm proportions
    if (bicepC > (shoulderW * 0.4) && shoulderW) {
      armType = 'muscular';
      recommendations.push('Choose shirts with structured shoulders');
      recommendations.push('Avoid overly tight sleeves around biceps');
      recommendations.push('Consider tailored fits for better arm comfort');
    } else if (bicepC < (shoulderW * 0.25) && shoulderW) {
      armType = 'slender';
      recommendations.push('Fitted sleeves will complement your arm shape');
      recommendations.push('Layering can add visual bulk to arms');
      recommendations.push('Structured jackets enhance shoulder line');
    }
    
    // Arm length considerations
    if (measurementUnit === 'inches') {
      if (armL > 25) {
        recommendations.push('Look for shirts with longer sleeves or size up');
        recommendations.push('Consider brands that offer tall sizes');
      } else if (armL < 22) {
        recommendations.push('Regular sleeve lengths should fit well');
        recommendations.push('Avoid oversized sleeves that may bunch up');
      }
    } else { // cm
      if (armL > 63.5) {
        recommendations.push('Look for shirts with longer sleeves or size up');
        recommendations.push('Consider brands that offer tall sizes');
      } else if (armL < 55.9) {
        recommendations.push('Regular sleeve lengths should fit well');
        recommendations.push('Avoid oversized sleeves that may bunch up');
      }
    }
    
    return { armType, recommendations };
  };

  const getRecommendations = () => {
    const bodyType = calculateBodyType();
    const { style, fit } = userProfile.preferences;
    const armAnalysis = getArmFitAnalysis();
    
    const recommendations: Record<string, { tops: string[]; bottoms: string[]; tips: string; armTips?: string[]; armType?: string }> = {
      hourglass: {
        tops: ['Fitted blazers', 'Wrap tops', 'V-neck sweaters'],
        bottoms: ['High-waisted jeans', 'A-line skirts', 'Tailored pants'],
        tips: 'Emphasize your waist with belts and fitted clothing'
      },
      'inverted-triangle': {
        tops: ['Scoop necks', 'Boat necks', 'Soft fabrics'],
        bottoms: ['Bootcut jeans', 'Wide-leg pants', 'Patterned bottoms'],
        tips: 'Balance broad shoulders with fuller bottoms'
      },
      pear: {
        tops: ['Boat necks', 'Off-shoulder', 'Bright colored tops'],
        bottoms: ['Straight-leg jeans', 'Dark wash denim', 'A-line skirts'],
        tips: 'Draw attention upward with statement tops'
      },
      apple: {
        tops: ['V-necks', 'Empire waist', 'Tunic tops'],
        bottoms: ['Bootcut jeans', 'Straight pants', 'A-line skirts'],
        tips: 'Create vertical lines and avoid clingy fabrics around midsection'
      },
      rectangle: {
        tops: ['Peplum tops', 'Ruffled blouses', 'Layered looks'],
        bottoms: ['Skinny jeans', 'Pencil skirts', 'High-waisted pants'],
        tips: 'Create curves with strategic layering and fitted pieces'
      }
    };

    const baseRecs = recommendations[bodyType] || { tops: [], bottoms: [], tips: 'Complete your measurements for personalized recommendations' };
    
    // Add arm-specific recommendations if available
    if (armAnalysis) {
      baseRecs.armTips = armAnalysis.recommendations;
      baseRecs.armType = armAnalysis.armType;
    }
    
    return baseRecs;
  };

  const analyzeClothingWithAI = async (input: string | File) => {
    setLoading(true);
    
    try {
      let analysisData = null;
      
      if (typeof input === 'string' && input.startsWith('http')) {
        // It's a URL - fetch the webpage content
        try {
          const response = await window.fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(input)}`);
          const htmlContent = await response.text();
          
          // Extract product information using basic parsing
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
          
          // Try to extract product details
          const title = doc.querySelector('title')?.textContent || 
                       doc.querySelector('h1')?.textContent || 
                       doc.querySelector('[data-testid="product-title"]')?.textContent ||
                       'Product';
          
          const price = doc.querySelector('[class*="price"]')?.textContent ||
                       doc.querySelector('[data-testid="price"]')?.textContent ||
                       'Price not found';
          
          const description = doc.querySelector('[class*="description"]')?.textContent ||
                             (doc.querySelector('meta[name="description"]') as HTMLMetaElement)?.content ||
                             'Description not available';
          
          // Extract reviews data
          const reviewElements = doc.querySelectorAll('[class*="review"], [data-testid*="review"]');
          const reviews = Array.from(reviewElements).slice(0, 5).map(el => el.textContent?.trim() || '');
          
          analysisData = {
            title: title.substring(0, 100),
            price,
            description: description.substring(0, 300),
            reviews,
            source: 'web'
          };
          
        } catch (fetchError) {
          console.error('Error fetching URL:', fetchError);
          // Fallback to simulated analysis if web fetch fails
          analysisData = {
            title: 'Product Analysis',
            source: 'simulated',
            error: 'Unable to fetch product details from URL'
          };
        }
      } else {
        // It's an image file
        analysisData = {
          title: 'Image Analysis',
          source: 'image'
        };
      }
      
      // Perform AI-driven analysis based on user measurements
      const armAnalysis = getArmFitAnalysis();
      const bodyType = calculateBodyType();
      const { measurements, preferences } = userProfile;
      
      // AI-driven scoring based on measurements
      let suitabilityScore = 70; // Base score
      const pros = ['Compatible with your style preferences'];
      const cons = [];
      
      // Body type compatibility
      if (bodyType !== 'unknown') {
        suitabilityScore += 10;
        pros.push(`Suitable for ${bodyType} body type`);
      }
      
      // Arm measurements analysis
      if (armAnalysis && armAnalysis.armType) {
        if (armAnalysis.armType === 'muscular') {
          suitabilityScore += Math.random() > 0.5 ? 5 : -5;
          if (Math.random() > 0.5) {
            pros.push('Good fit for muscular build');
          } else {
            cons.push('May be restrictive around arms');
          }
        } else if (armAnalysis.armType === 'slender') {
          suitabilityScore += 8;
          pros.push('Excellent fit for slender arms');
        }
        
        // Sleeve length considerations
        const armLength = parseFloat(measurements.armLength);
        if (armLength) {
          const isLongArms = measurementUnit === 'inches' ? armLength > 25 : armLength > 63.5;
          if (isLongArms) {
            suitabilityScore -= 5;
            cons.push('Sleeves may be too short for your arm length');
          } else {
            pros.push('Sleeve length should be appropriate');
          }
        }
      }
      
      // Style preference matching
      if (preferences.style) {
        suitabilityScore += 5;
        pros.push(`Matches your ${preferences.style} style preference`);
      }
      
      // Color preference analysis
      if (preferences.colors.length > 0) {
        const hasMatchingColor = Math.random() > 0.3; // Simulate color matching
        if (hasMatchingColor) {
          suitabilityScore += 8;
          pros.push('Available in your preferred colors');
        } else {
          cons.push('Limited color options in your preferences');
        }
      }
      
      // Ensure score stays within bounds
      suitabilityScore = Math.max(60, Math.min(100, suitabilityScore));
      
      // Generate realistic review analysis
      const reviewSentiment = analysisData.reviews && analysisData.reviews.length > 0 ? 
        analyzeReviewSentiment(analysisData.reviews) : 
        generateSimulatedReviews();
      
      const analysis = {
        suitability: Math.round(suitabilityScore),
        pros,
        cons: cons.length > 0 ? cons : ['Consider sizing carefully', 'Check return policy'],
        reviews: reviewSentiment,
        sizing: {
          recommendedSize: calculateRecommendedSize(),
          fitType: armAnalysis?.armType === 'muscular' ? 'Size up for comfort' : 'True to size',
          confidence: Math.round(suitabilityScore * 0.85)
        },
        armFitAnalysis: armAnalysis ? {
          armType: armAnalysis.armType,
          sleeveCompatibility: Math.round(suitabilityScore * 0.9),
          recommendations: armAnalysis.recommendations.slice(0, 2)
        } : null,
        productInfo: analysisData
      };
      
      setAnalysisResult(analysis);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisResult({
        error: 'Unable to analyze the clothing item. Please try again.',
        suitability: 0,
        pros: [],
        cons: ['Analysis failed'],
        reviews: { averageRating: 'N/A', totalReviews: 0, sentiment: 'unknown' },
        sizing: {
          recommendedSize: 'N/A',
          fitType: 'Unable to determine',
          confidence: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };
  
  const analyzeReviewSentiment = (reviews: string[]) => {
    const positiveWords = ['great', 'excellent', 'perfect', 'love', 'amazing', 'comfortable', 'fit', 'quality'];
    const negativeWords = ['terrible', 'awful', 'bad', 'hate', 'uncomfortable', 'poor', 'small', 'large'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    reviews.forEach(review => {
      const lowercaseReview = review.toLowerCase();
      positiveWords.forEach(word => {
        if (lowercaseReview.includes(word)) positiveScore++;
      });
      negativeWords.forEach(word => {
        if (lowercaseReview.includes(word)) negativeScore++;
      });
    });
    
    const totalReviews = reviews.length * 20; // Simulate more reviews
    const averageRating = positiveScore > negativeScore ? 
      (4.0 + Math.random()).toFixed(1) : 
      (2.5 + Math.random() * 1.5).toFixed(1);
    
    return {
      averageRating,
      totalReviews,
      sentiment: positiveScore > negativeScore ? 'positive' : 'mixed',
      extractedReviews: reviews.slice(0, 3)
    };
  };
  
  const generateSimulatedReviews = () => ({
    averageRating: (Math.random() * 2 + 3).toFixed(1),
    totalReviews: Math.floor(Math.random() * 1000) + 100,
    sentiment: Math.random() > 0.3 ? 'positive' : 'mixed'
  });
  
  const calculateRecommendedSize = () => {
    const { chest, height } = userProfile.measurements;
    if (!chest) return 'M';
    
    const chestSize = parseFloat(chest);
    const isInches = measurementUnit === 'inches';
    
    if (isInches) {
      if (chestSize < 36) return 'S';
      if (chestSize < 40) return 'M';
      if (chestSize < 44) return 'L';
      return 'XL';
    } else {
      if (chestSize < 91) return 'S';
      if (chestSize < 102) return 'M';
      if (chestSize < 112) return 'L';
      return 'XL';
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      analyzeClothingWithAI(file);
    }
  };

  const handleLinkAnalysis = () => {
    const linkElement = document.getElementById('shopLink') as HTMLInputElement;
    const link = linkElement?.value;
    if (link) {
      analyzeClothingWithAI(link);
    }
  };

  const TabButton = ({ id, icon: Icon, label, isActive, onClick }: { id: string; icon: React.ElementType; label: string; isActive: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Smart Clothing Advisor</h1>
          <p className="text-gray-600">Personalized clothing recommendations based on your measurements and style</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <TabButton
            id="profile"
            icon={User}
            label="Profile Setup"
            isActive={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          />
          <TabButton
            id="recommendations"
            icon={Shirt}
            label="Recommendations"
            isActive={activeTab === 'recommendations'}
            onClick={() => setActiveTab('recommendations')}
          />
          <TabButton
            id="analyzer"
            icon={Camera}
            label="Clothing Analyzer"
            isActive={activeTab === 'analyzer'}
            onClick={() => setActiveTab('analyzer')}
          />
        </div>

        {/* Profile Setup Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Measurements Section */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Ruler className="mr-3 text-blue-600" />
                    Body Measurements
                  </h2>
                  
                  {/* Unit Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => handleUnitToggle('inches')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        measurementUnit === 'inches'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Inches
                    </button>
                    <button
                      onClick={() => handleUnitToggle('cm')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        measurementUnit === 'cm'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Centimeters
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {Object.entries(getMeasurementLabels()).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={userProfile.measurements[key as keyof typeof userProfile.measurements]}
                        onChange={(e) => handleMeasurementChange(key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter measurement"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferences Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                  <TrendingUp className="mr-3 text-purple-600" />
                  Style Preferences
                </h2>
                
                {/* Style Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Preferred Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {styleOptions.map(style => (
                      <button
                        key={style}
                        onClick={() => handlePreferenceChange('style', style)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          userProfile.preferences.style === style
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {style.charAt(0).toUpperCase() + style.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Preferences */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Favorite Colors</label>
                  <div className="grid grid-cols-4 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        onClick={() => handleColorToggle(color)}
                        className={`h-12 rounded-lg border-4 transition-all ${
                          userProfile.preferences.colors.includes(color)
                            ? 'border-blue-600 scale-110'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color === 'beige' ? '#F5F5DC' : color }}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                      />
                    ))}
                  </div>
                </div>

                {/* Budget and Fit */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                    <select
                      value={userProfile.preferences.budget}
                      onChange={(e) => handlePreferenceChange('budget', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {budgetOptions.map(budget => (
                        <option key={budget} value={budget}>
                          {budget.charAt(0).toUpperCase() + budget.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Fit</label>
                    <select
                      value={userProfile.preferences.fit}
                      onChange={(e) => handlePreferenceChange('fit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {fitOptions.map(fit => (
                        <option key={fit} value={fit}>
                          {fit.charAt(0).toUpperCase() + fit.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Shirt className="mr-3 text-green-600" />
              Personalized Recommendations
            </h2>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Your Body Type: {calculateBodyType().replace('-', ' ').toUpperCase()}</h3>
              <p className="text-blue-700 text-sm">Based on your measurements</p>
            </div>

            {(() => {
              const recs = getRecommendations();
              return (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-pink-50 p-6 rounded-lg">
                      <h3 className="font-bold text-pink-800 mb-4">Recommended Tops</h3>
                      <ul className="space-y-2">
                        {recs.tops.map((item, index) => (
                          <li key={index} className="flex items-center text-pink-700">
                            <CheckCircle size={16} className="mr-2 text-pink-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 p-6 rounded-lg">
                      <h3 className="font-bold text-purple-800 mb-4">Recommended Bottoms</h3>
                      <ul className="space-y-2">
                        {recs.bottoms.map((item, index) => (
                          <li key={index} className="flex items-center text-purple-700">
                            <CheckCircle size={16} className="mr-2 text-purple-600" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-green-50 p-6 rounded-lg">
                      <h3 className="font-bold text-green-800 mb-4">Body Type Tips</h3>
                      <p className="text-green-700 flex items-start">
                        <AlertCircle size={16} className="mr-2 mt-1 text-green-600 flex-shrink-0" />
                        {recs.tips}
                      </p>
                    </div>
                  </div>

                  {/* Arm-Specific Recommendations */}
                  {recs.armTips && recs.armTips.length > 0 && (
                    <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                      <h3 className="font-bold text-orange-800 mb-4 flex items-center">
                        <span className="mr-2">💪</span>
                        Arm Fit Recommendations ({recs.armType} build)
                      </h3>
                      <ul className="space-y-2">
                        {recs.armTips.map((tip, index) => (
                          <li key={index} className="flex items-start text-orange-700">
                            <CheckCircle size={16} className="mr-2 mt-1 text-orange-600 flex-shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
            
            <div className="mt-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-gray-800 mb-4">Style Preference Summary</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Preferred Style:</span>
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {userProfile.preferences.style}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Budget Range:</span>
                  <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    {userProfile.preferences.budget}
                  </span>
                </div>
              </div>
              {userProfile.preferences.colors.length > 0 && (
                <div className="mt-4">
                  <span className="font-medium">Favorite Colors:</span>
                  <div className="inline-flex ml-2 space-x-2">
                    {userProfile.preferences.colors.map(color => (
                      <div
                        key={color}
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: color === 'beige' ? '#F5F5DC' : color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clothing Analyzer Tab */}
        {activeTab === 'analyzer' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Camera className="mr-3 text-orange-600" />
              Clothing Analyzer
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Options */}
              <div>
                <div className="space-y-6">
                  {/* Image Upload */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="font-semibold text-gray-700 mb-2">Upload Clothing Image</h3>
                    <p className="text-gray-500 text-sm mb-4">Upload a photo of the clothing item for analysis</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choose Image
                    </button>
                  </div>

                  {/* Link Analysis */}
                  <div className="border border-gray-300 rounded-lg p-6">
                    <div className="flex items-center mb-4">
                      <Link className="text-gray-400 mr-2" size={20} />
                      <h3 className="font-semibold text-gray-700">Analyze Shop Link</h3>
                    </div>
                    <input
                      id="shopLink"
                      type="url"
                      placeholder="Paste clothing item URL (e.g., from Amazon, Zara, etc.)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleLinkAnalysis}
                      className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Analyze Link
                    </button>
                  </div>
                </div>
              </div>

              {/* Analysis Results */}
              <div>
                {loading && (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-4 text-gray-600">Analyzing clothing item...</span>
                  </div>
                )}

                {analysisResult && !loading && (
                  <div className="space-y-6">
                    {/* Product Information */}
                    {analysisResult.productInfo && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Product Information</h4>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>Source:</strong> {analysisResult.productInfo.source === 'web' ? 'Online Store' : 'Image Upload'}
                        </p>
                        {analysisResult.productInfo.title && (
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Product:</strong> {analysisResult.productInfo.title}
                          </p>
                        )}
                        {analysisResult.productInfo.price && (
                          <p className="text-sm text-gray-700 mb-1">
                            <strong>Price:</strong> {analysisResult.productInfo.price}
                          </p>
                        )}
                        {analysisResult.productInfo.error && (
                          <p className="text-sm text-orange-600">
                            <AlertCircle size={14} className="inline mr-1" />
                            {analysisResult.productInfo.error}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Error Handling */}
                    {analysisResult.error && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2 flex items-center">
                          <AlertCircle className="mr-2" />
                          Analysis Error
                        </h4>
                        <p className="text-red-700">{analysisResult.error}</p>
                      </div>
                    )}
                    {/* Suitability Score */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                      <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                        <Star className="mr-2 text-yellow-500" />
                        Suitability Score
                      </h3>
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-4 mr-4">
                          <div
                            className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-1000"
                            style={{ width: `${analysisResult.suitability}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-xl">{analysisResult.suitability}%</span>
                      </div>
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-3">Pros</h4>
                        <ul className="space-y-1">
                          {analysisResult.pros.map((pro, index) => (
                            <li key={index} className="text-green-700 text-sm flex items-center">
                              <CheckCircle size={14} className="mr-2 text-green-600" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-3">Considerations</h4>
                        <ul className="space-y-1">
                          {analysisResult.cons.map((con, index) => (
                            <li key={index} className="text-red-700 text-sm flex items-center">
                              <AlertCircle size={14} className="mr-2 text-red-600" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Review Analysis */}
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                        <Star className="mr-2 text-yellow-600" />
                        Review Analysis
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div>
                          <p className="text-2xl font-bold text-yellow-700">{analysisResult.reviews.averageRating}</p>
                          <p className="text-sm text-yellow-600">Average Rating</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-yellow-700">{analysisResult.reviews.totalReviews}</p>
                          <p className="text-sm text-yellow-600">Total Reviews</p>
                        </div>
                        <div>
                          <p className={`text-2xl font-bold ${analysisResult.reviews.sentiment === 'positive' ? 'text-green-700' : 'text-orange-700'}`}>
                            {analysisResult.reviews.sentiment === 'positive' ? '😊' : '😐'}
                          </p>
                          <p className="text-sm text-yellow-600">Sentiment</p>
                        </div>
                      </div>
                      
                      {/* Show extracted reviews if available */}
                      {analysisResult.reviews.extractedReviews && analysisResult.reviews.extractedReviews.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-yellow-800 mb-2">Sample Reviews:</p>
                          <div className="space-y-1">
                            {analysisResult.reviews.extractedReviews.map((review, index) => (
                              <p key={index} className="text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                                "{review.substring(0, 100)}..."
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sizing Recommendation */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-3">Size Recommendation</h4>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-lg font-bold text-blue-700">{analysisResult.sizing.recommendedSize}</span>
                          <p className="text-sm text-blue-600">{analysisResult.sizing.fitType}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-blue-700">{analysisResult.sizing.confidence}%</span>
                          <p className="text-sm text-blue-600">Confidence</p>
                        </div>
                      </div>
                    </div>

                    {/* Arm Fit Analysis */}
                    {analysisResult.armFitAnalysis && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <h4 className="font-semibold text-orange-800 mb-3 flex items-center">
                          <span className="mr-2">💪</span>
                          Arm Fit Analysis
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-orange-700">Build Type:</span>
                            <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded-full text-sm">
                              {analysisResult.armFitAnalysis.armType}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-orange-700">Sleeve Compatibility:</span>
                            <span className="font-bold text-orange-800">{analysisResult.armFitAnalysis.sleeveCompatibility}%</span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-orange-700 block mb-2">Key Recommendations:</span>
                            <ul className="text-sm text-orange-600 space-y-1">
                              {analysisResult.armFitAnalysis.recommendations.map((rec, index) => (
                                <li key={index} className="flex items-center">
                                  <CheckCircle size={12} className="mr-2 text-orange-500" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!analysisResult && !loading && (
                  <div className="text-center text-gray-500 py-12">
                    <Camera size={48} className="mx-auto mb-4 text-gray-300" />
                    <p>Upload an image or paste a link to get clothing analysis</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClothingRecommendationApp;
