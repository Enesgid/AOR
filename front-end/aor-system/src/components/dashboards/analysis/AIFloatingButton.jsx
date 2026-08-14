import {
  Bot,
  X,
  RefreshCw,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  ShieldAlert,
  ArrowUpRight,
  Clock3,
  Activity,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { getCurrentToken } from "../../../utils/session";
import {Link} from "react-router-dom";

const AIFloatingButton = () => {
  const buttonRef = useRef(null);

  const [position, setPosition] = useState(() => ({
    x:
      typeof window !== "undefined"
        ? window.innerWidth - 100
        : 0,

    y:
      typeof window !== "undefined"
        ? window.innerHeight - 90
        : 0,
  }));

  const [dragging, setDragging] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [showRecommendation, setShowRecommendation] =
    useState(false);

  const [recommendation, setRecommendation] =
    useState(null);

  const [intelligence, setIntelligence] =
    useState(null);

  const [loadingAI, setLoadingAI] =
    useState(false);

  const [aiError, setAiError] = useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  const [refreshSuccess, setRefreshSuccess] =
    useState(false);

  const buttonSize = 56;
  const edgeGap = 10;

  const buttonSideRef = useRef("right");

  const dragOffset = useRef({
    x: 0,
    y: 0,
  });

  // =========================================================
  // FETCH AI INTELLIGENCE
  // =========================================================

  const fetchAIRecommendation = async (
    showNotification = false,
    forceRefresh = false
  ) => {
    try {
      setLoadingAI(true);
      setAiError("");
      setRefreshSuccess(false);

      const token = getCurrentToken();

      const response = await fetch(
        forceRefresh
  ? "https://aor-q19z.onrender.com/api/ai/refresh"
  : "https://aor-q19z.onrender.com/api/ai/summary",
        {
          method: forceRefresh ? "POST" : "GET",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          "The AI server returned an invalid response."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to generate AI recommendation."
        );
      }

      setRecommendation(
        data.aiRecommendation || null
      );

      setIntelligence(
        data.intelligence || null
      );

      setLastUpdated(
        data.generatedAt || new Date().toISOString()
      );

      if (forceRefresh) {
        setRefreshSuccess(true);

        setTimeout(() => {
          setRefreshSuccess(false);
        }, 4000);
      }

      if (
        showNotification &&
        data.aiRecommendation
      ) {
        setShowRecommendation(true);
      }
    } catch (error) {
      console.error(
        "AI Recommendation Error:",
        error
      );

      setAiError(
        error.message ||
          "Unable to load AI recommendation."
      );

      setRecommendation(null);
    } finally {
      setLoadingAI(false);
    }
  };

  // =========================================================
  // DRAGGING
  // =========================================================

  const handlePointerDown = (event) => {
    event.preventDefault();

    const rect =
      buttonRef.current.getBoundingClientRect();

    dragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    setDragging(true);

    buttonRef.current?.setPointerCapture(
      event.pointerId
    );
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;

    let newX =
      event.clientX -
      dragOffset.current.x;

    let newY =
      event.clientY -
      dragOffset.current.y;

    newX = Math.max(
      edgeGap,
      Math.min(
        newX,
        window.innerWidth -
          buttonSize -
          edgeGap
      )
    );

    newY = Math.max(
      edgeGap,
      Math.min(
        newY,
        window.innerHeight -
          buttonSize -
          edgeGap
      )
    );

    const buttonCenter =
      newX + buttonSize / 2;

    buttonSideRef.current =
      buttonCenter <
      window.innerWidth / 2
        ? "left"
        : "right";

    setPosition({
      x: newX,
      y: newY,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);

    setPosition((current) => ({
      x:
        buttonSideRef.current === "left"
          ? edgeGap
          : window.innerWidth -
            buttonSize -
            edgeGap,

      y: Math.max(
        edgeGap,
        Math.min(
          current.y,
          window.innerHeight -
            buttonSize -
            edgeGap
        )
      ),
    }));
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchAIRecommendation(true);
  }, []);

  // =========================================================
  // NOTIFICATION AUTO HIDE
  // =========================================================

  useEffect(() => {
    if (!showRecommendation) return;

    const timer = setTimeout(() => {
      setShowRecommendation(false);
    }, 7000);

    return () => clearTimeout(timer);
  }, [showRecommendation]);

  // =========================================================
  // WINDOW RESIZE
  // =========================================================

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => ({
        x:
          buttonSideRef.current === "left"
            ? edgeGap
            : window.innerWidth -
              buttonSize -
              edgeGap,

        y: Math.max(
          edgeGap,
          Math.min(
            current.y,
            window.innerHeight -
              buttonSize -
              edgeGap
          )
        ),
      }));
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const safeText = (value, fallback = "") => {
    if (
      value === null ||
      value === undefined
    ) {
      return fallback;
    }

    if (typeof value === "string") {
      return value;
    }

    if (
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }

    return fallback;
  };

  const renderFindingList = (
    items,
    emptyMessage = "No items identified."
  ) => {
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return (
        <div
          className="
            rounded-xl
            border
            border-dashed
            border-gray-300
            p-4
            text-center
            bg-gray-50
          "
        >
          <p className="text-sm text-gray-500">
            {emptyMessage}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((item, index) => {
          if (
            !item ||
            typeof item !== "object"
          ) {
            return null;
          }

          return (
            <div
              key={index}
              className="
                bg-white
                border
                border-gray-200
                rounded-xl
                p-4
                hover:shadow-sm
                transition-shadow
              "
            >
              {item.title && (
                <h6 className="font-semibold text-gray-800">
                  {safeText(item.title)}
                </h6>
              )}

              {item.description && (
                <p className="text-sm text-gray-600 mt-1 leading-5">
                  {safeText(item.description)}
                </p>
              )}

              {item.impact && (
                <div className="mt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                    Impact
                  </p>

                  <p className="text-sm text-gray-600 mt-1">
                    {safeText(item.impact)}
                  </p>
                </div>
              )}

              {item.recommendedAction && (
                <div
                  className="
                    mt-3
                    p-3
                    rounded-lg
                    bg-purple-50
                    border
                    border-purple-100
                  "
                >
                  <p className="text-[11px] font-bold uppercase tracking-wide text-purple-600">
                    Recommended Action
                  </p>

                  <p className="text-sm text-gray-700 mt-1">
                    {safeText(
                      item.recommendedAction
                    )}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const criticalCount =
    Array.isArray(
      recommendation?.criticalIssues
    )
      ? recommendation.criticalIssues.length
      : 0;

  const warningCount =
    Array.isArray(
      recommendation?.warnings
    )
      ? recommendation.warnings.length
      : 0;

  const performanceCount =
    Array.isArray(
      recommendation?.performanceInsights
    )
      ? recommendation.performanceInsights.length
      : 0;

  const positiveCount =
    Array.isArray(
      recommendation?.positiveFindings
    )
      ? recommendation.positiveFindings.length
      : 0;

  const priorityCount =
    Array.isArray(
      recommendation?.priorityActions
    )
      ? recommendation.priorityActions.length
      : 0;

  const formatDate = (date) => {
    if (!date) return "Not available";

    try {
      return new Date(date).toLocaleString();
    } catch {
      return "Not available";
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* =====================================================
          NEW RECOMMENDATION NOTIFICATION
      ====================================================== */}

      {showRecommendation && (
        <div
          className="
            fixed
            z-[210]
            w-[340px]
            max-w-[calc(100vw-30px)]
            bg-white
            border
            border-purple-200
            rounded-2xl
            shadow-2xl
            p-4
          "
          style={{
            left: Math.max(
              15,
              Math.min(
                position.x - 280,
                window.innerWidth - 355
              )
            ),

            top:
              position.y > 190
                ? position.y - 150
                : position.y + 70,
          }}
        >
          <div className="flex items-start gap-3">

            <div
              className="
                w-10
                h-10
                rounded-xl
                bg-purple-50
                text-purple-700
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <Bot size={20} />
            </div>

            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-800">
                  Director Intelligence Updated
                </h4>
              </div>

              <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                {loadingAI
                  ? "Analyzing university data..."
                  : safeText(
                      recommendation?.overallAssessment,
                      "A new university intelligence report is available."
                    )}
              </p>

              <button
                onClick={() => {
                  setShowRecommendation(false);
                  setShowPanel(true);
                }}
                className="
                  mt-3
                  text-sm
                  font-semibold
                  text-purple-600
                  hover:text-purple-800
                "
              >
                Open intelligence report →
              </button>

            </div>

            <button
              onClick={() =>
                setShowRecommendation(false)
              }
              className="
                text-gray-400
                hover:text-gray-700
                shrink-0
              "
            >
              <X size={17} />
            </button>

          </div>
        </div>
      )}

      {/* =====================================================
          FLOATING AI BUTTON
      ====================================================== */}

      <button
        ref={buttonRef}
        onPointerDown={
          handlePointerDown
        }
        onPointerMove={
          handlePointerMove
        }
        onPointerUp={
          handlePointerUp
        }
        onClick={() =>
          setShowPanel(!showPanel)
        }
        className={`
          fixed
          z-[200]
          w-14
          h-14
          rounded-full
          bg-[#4e094e]
          text-white
          shadow-xl
          flex
          items-center
          justify-center
          select-none
          touch-none

          ${
            dragging
              ? "cursor-grabbing scale-110"
              : "cursor-grab hover:bg-[#c00ec0]"
          }

          transition-all
          duration-200
        `}
        style={{
          left: position.x,
          top: position.y,
        }}
        title="Open AI Director Assistant"
      >
        <Bot size={25} />
      </button>

      {showPanel && (
        <div
          className="
            fixed
            right-6
            bottom-6
            z-[205]
            w-[470px]
            max-w-[calc(100vw-24px)]
            bg-gray-50
            rounded-2xl
            shadow-2xl
            overflow-hidden
            border
            border-gray-200
          "
        >

          <div
            className="
              bg-[#4e094e]
              text-white
              p-5
            "
          >

            <div className="flex items-start justify-between">

              <div className="flex items-center gap-3">

                <div
                  className="
                    w-11
                    h-11
                    rounded-xl
                    bg-white/10
                    flex
                    items-center
                    justify-center
                  "
                >
                  <Bot size={22} />
                </div>

                <div>

                  <h3 className="font-semibold text-lg">
                    AI Director Assistant
                  </h3>

                  <p className="text-sm text-purple-100 mt-1">
                    AI Generated report Of the whole performances and weakness in the system workflow
                  </p>

                </div>

              </div>

              <button
                onClick={() =>
                  setShowPanel(false)
                }
                className="
                  btn btn-clear
                  rounded-xl
                  
                " title="close"
              >
                <X size={20} />
              </button>

            </div>

          </div>

          {/* =================================================
              PANEL BODY
          ================================================== */}

          <div
            className="
              p-5
              max-h-[calc(100vh-220px)]
              overflow-y-auto
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
                mb-5
              "
            >
              <div>
                <div className="flex items-center gap-2">
                  <Activity
                    size={18}
                    className="text-purple-600"
                  />
                  <h4 className="font-bold text-gray-800">
                    Director Intelligence Report
                  </h4>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  AI-assisted analysis of university responsibility data
                </p>
                {lastUpdated && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Clock3
                      size={13}
                      className="text-gray-400"
                    />

                    <span className="text-[11px] text-gray-400">
                      Updated {formatDate(lastUpdated)}
                    </span>

                  </div>
                )}

              </div>

              <button
                onClick={() =>
                  fetchAIRecommendation(
                    true,
                    true
                  )
                }
                disabled={loadingAI}
                className="
                btn btn-add
                  flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  rounded-lg
                  disabled:opacity-50
                  transition
                  shrink-0
                "
                title="Refresh university intelligence"
              >
                <RefreshCw
                  size={17}
                  className={
                    loadingAI
                      ? "animate-spin"
                      : ""
                  }
                />

                <span className="text-xs font-semibold">
                  Refresh
                </span>
              </button>

            </div>

            {/* =================================================
                REFRESH SUCCESS
            ================================================== */}

            {refreshSuccess && (
              <div
                className="
                  mb-4
                  px-4
                  py-3
                  rounded-xl
                  bg-green-50
                  border
                  border-green-200
                  text-green-700
                  text-sm
                  font-medium
                "
              >
                ✓ University intelligence refreshed successfully.
              </div>
            )}

            {/* =================================================
                LOADING
            ================================================== */}

            {loadingAI && (
              <div
                className="
                  p-7
                  rounded-xl
                  bg-white
                  border
                  border-gray-200
                  text-center
                "
              >

                <div
                  className="
                    w-12
                    h-12
                    rounded-full
                    bg-purple-50
                    flex
                    items-center
                    justify-center
                    mx-auto
                  "
                >
                  <RefreshCw
                    size={24}
                    className="
                      animate-spin
                      text-purple-600
                    "
                  />
                </div>

                <p className="text-sm font-medium text-gray-700 mt-4">
                  Analyzing university data...
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Please wait while the intelligence report is updated.
                </p>

              </div>
            )}

            {/* =================================================
                ERROR
            ================================================== */}

            {!loadingAI && aiError && (
              <div
                className="
                  p-4
                  rounded-xl
                  bg-red-50
                  border
                  border-red-200
                "
              >

                <div className="flex gap-3">

                  <AlertTriangle
                    size={21}
                    className="text-red-500 shrink-0"
                  />

                  <div>

                    <p className="font-semibold text-red-700">
                      Unable to load AI intelligence
                    </p>

                    <p className="text-sm text-red-600 mt-1">
                      {aiError}
                    </p>

                    <button
                      onClick={() =>
                        fetchAIRecommendation(
                          false,
                          false
                        )
                      }
                      className="
                        mt-3
                        text-sm
                        font-semibold
                        text-red-700
                        hover:text-red-900
                      "
                    >
                      Try again →
                    </button>

                  </div>

                </div>

              </div>
            )}

            {/* =================================================
                REPORT
            ================================================== */}

            {!loadingAI &&
              !aiError &&
              recommendation && (
                <div className="space-y-5">

                  {/* =================================================
                      SUMMARY CARDS
                  ================================================== */}

                  <div className="grid grid-cols-2 gap-3">

                    <div
                      className="
                        bg-red-50
                        border
                        border-red-100
                        rounded-xl
                        p-4
                      "
                    >

                      <div className="flex items-center gap-2">

                        <ShieldAlert
                          size={17}
                          className="text-red-600"
                        />

                        <span className="text-xs font-semibold text-red-700">
                          Critical Issues
                        </span>

                      </div>

                      <p className="text-2xl font-bold text-red-700 mt-2">
                        {criticalCount}
                      </p>

                    </div>

                    <div
                      className="
                        bg-amber-50
                        border
                        border-amber-100
                        rounded-xl
                        p-4
                      "
                    >

                      <div className="flex items-center gap-2">

                        <AlertTriangle
                          size={17}
                          className="text-amber-600"
                        />

                        <span className="text-xs font-semibold text-amber-700">
                          Warnings
                        </span>

                      </div>

                      <p className="text-2xl font-bold text-amber-700 mt-2">
                        {warningCount}
                      </p>

                    </div>

                    <div
                      className="
                        bg-blue-50
                        border
                        border-blue-100
                        rounded-xl
                        p-4
                      "
                    >

                      <div className="flex items-center gap-2">

                        <Lightbulb
                          size={17}
                          className="text-blue-600"
                        />

                        <span className="text-xs font-semibold text-blue-700">
                          Insights
                        </span>

                      </div>

                      <p className="text-2xl font-bold text-blue-700 mt-2">
                        {performanceCount}
                      </p>

                    </div>

                    <div
                      className="
                        bg-green-50
                        border
                        border-green-100
                        rounded-xl
                        p-4
                      "
                    >

                      <div className="flex items-center gap-2">

                        <CheckCircle
                          size={17}
                          className="text-green-600"
                        />

                        <span className="text-xs font-semibold text-green-700">
                          Positives
                        </span>

                      </div>

                      <p className="text-2xl font-bold text-green-700 mt-2">
                        {positiveCount}
                      </p>

                    </div>

                  </div>

                  {/* =================================================
                      OVERALL ASSESSMENT
                  ================================================== */}

                  <section
                    className="
                      bg-white
                      rounded-xl
                      border
                      border-purple-100
                      p-5
                      shadow-sm
                    "
                  >

                    <div className="flex items-center gap-2">

                      <Bot
                        size={19}
                        className="text-purple-600"
                      />

                      <h5 className="font-semibold text-gray-800">
                        Overall Assessment
                      </h5>

                    </div>

                    <p className="text-sm text-gray-600 leading-6 mt-3">
                      {safeText(
                        recommendation.overallAssessment,
                        "No overall assessment available."
                      )}
                    </p>

                  </section>

                  {/* =================================================
                      CRITICAL ISSUES
                  ================================================== */}

                  <section>

                    <div className="flex items-center justify-between mb-3">

                      <div className="flex items-center gap-2">

                        <ShieldAlert
                          size={19}
                          className="text-red-600"
                        />

                        <h5 className="font-semibold text-gray-800">
                          Critical Issues
                        </h5>

                      </div>

                      <span
                        className="
                          text-xs
                          font-bold
                          bg-red-100
                          text-red-700
                          px-2.5
                          py-1
                          rounded-full
                        "
                      >
                        {criticalCount}
                      </span>

                    </div>

                    {renderFindingList(
                      recommendation.criticalIssues,
                      "No critical issues identified."
                    )}

                  </section>

                  {/* =================================================
                      WARNINGS
                  ================================================== */}

                  <section>

                    <div className="flex items-center justify-between mb-3">

                      <div className="flex items-center gap-2">

                        <AlertTriangle
                          size={19}
                          className="text-amber-500"
                        />

                        <h5 className="font-semibold text-gray-800">
                          Warnings
                        </h5>

                      </div>

                      <span
                        className="
                          text-xs
                          font-bold
                          bg-amber-100
                          text-amber-700
                          px-2.5
                          py-1
                          rounded-full
                        "
                      >
                        {warningCount}
                      </span>

                    </div>

                    {renderFindingList(
                      recommendation.warnings,
                      "No developing warnings identified."
                    )}

                  </section>

                  {/* =================================================
                      PERFORMANCE INSIGHTS
                  ================================================== */}

                  <section>

                    <div className="flex items-center justify-between mb-3">

                      <div className="flex items-center gap-2">

                        <Lightbulb
                          size={19}
                          className="text-blue-600"
                        />

                        <h5 className="font-semibold text-gray-800">
                          Performance Insights
                        </h5>

                      </div>

                      <span
                        className="
                          text-xs
                          font-bold
                          bg-blue-100
                          text-blue-700
                          px-2.5
                          py-1
                          rounded-full
                        "
                      >
                        {performanceCount}
                      </span>

                    </div>

                    {renderFindingList(
                      recommendation.performanceInsights,
                      "No performance insights identified."
                    )}

                  </section>

                  {/* =================================================
                      POSITIVE FINDINGS
                  ================================================== */}

                  <section>

                    <div className="flex items-center justify-between mb-3">

                      <div className="flex items-center gap-2">

                        <CheckCircle
                          size={19}
                          className="text-green-600"
                        />

                        <h5 className="font-semibold text-gray-800">
                          Positive Findings
                        </h5>

                      </div>

                      <span
                        className="
                          text-xs
                          font-bold
                          bg-green-100
                          text-green-700
                          px-2.5
                          py-1
                          rounded-full
                        "
                      >
                        {positiveCount}
                      </span>

                    </div>

                    {renderFindingList(
                      recommendation.positiveFindings,
                      "No positive findings identified."
                    )}

                  </section>


                  <section>

                    <div className="flex items-center justify-between mb-3">

                      <div className="flex items-center gap-2">

                        <ArrowUpRight
                          size={19}
                          className="text-purple-600"
                        />

                        <h5 className="font-semibold text-gray-800">
                          Priority Actions
                        </h5>

                      </div>

                      <span
                        className="
                          text-xs
                          font-bold
                          bg-purple-100
                          text-purple-700
                          px-2.5
                          py-1
                          rounded-full
                        "
                      >
                        {priorityCount}
                      </span>

                    </div>

                    {Array.isArray(
                      recommendation.priorityActions
                    ) &&
                    recommendation.priorityActions.length > 0 ? (

                      <div className="space-y-3">

                        {recommendation.priorityActions.map(
                          (action, index) => {

                            if (
                              !action ||
                              typeof action !== "object"
                            ) {
                              return null;
                            }

                            const priority =
                              safeText(
                                action.priority,
                                "Priority"
                              );

                            return (
                              <div
  key={index}
  className="
    bg-white
    border
    border-gray-200
    rounded-xl
    p-4
  "
>
  <div className="flex items-start gap-3">

    <div
      className="
        w-8
        h-8
        rounded-full
        bg-purple-100
        text-purple-700
        flex
        items-center
        justify-center
        text-xs
        font-bold
        shrink-0
      "
    >
      {index + 1}
    </div>

    <div className="flex-1">

      <span
        className={`
          inline-block
          text-[11px]
          font-bold
          px-2
          py-1
          rounded-full
          mb-2

          ${
            priority === "High"
              ? "bg-red-100 text-red-700"
              : priority === "Medium"
              ? "bg-amber-100 text-amber-700"
              : "bg-green-100 text-green-700"
          }
        `}
      >
        {priority}
      </span>

      <p className="text-sm font-semibold text-gray-800 leading-5">
        {safeText(
          action.action,
          "No action description available."
        )}
      </p>

      {action.reason && (
        <div className="mt-2">

          <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
            Reason
          </p>

          <p className="text-sm text-gray-500 mt-1 leading-5">
            {safeText(action.reason)}
          </p>

        </div>
      )}

      {/* ACTION BUTTON */}

{action.action?.toLowerCase().includes("approval") && (
        <Link
          to="/faculties"
          className="
            btn btn-blue no-underline
          "
        >
          Review Approvals
          <ArrowUpRight size={14} />
        </Link>
      )}

    </div>

  </div>
                            </div>
                            );
                          }
                        )}

                      </div>

                    ) : (

                      <div
                        className="
                          p-4
                          rounded-xl
                          border
                          border-dashed
                          border-gray-300
                          bg-gray-50
                          text-center
                        "
                      >
                        <p className="text-sm text-gray-500">
                          No priority actions identified.
                        </p>
                      </div>

                    )}

                  </section>

                  <div
                    className="
                      pt-3
                      border-t
                      border-gray-200
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <div className="flex items-center gap-2">

                      <div
                        className="
                          w-2
                          h-2
                          rounded-full
                          bg-green-500
                        "
                      />

                      <span className="text-xs text-gray-500">
                        Intelligence report available
                      </span>

                    </div>

                    <span className="text-[11px] text-gray-400">
                      AI-assisted
                    </span>

                  </div>

                </div>
              )}

            {/* =================================================
                NO DATA
            ================================================== */}

            {!loadingAI &&
              !aiError &&
              !recommendation && (
                <div
                  className="
                    p-7
                    bg-white
                    rounded-xl
                    border
                    border-gray-200
                    text-center
                  "
                >

                  <div
                    className="
                      w-12
                      h-12
                      rounded-full
                      bg-purple-50
                      flex
                      items-center
                      justify-center
                      mx-auto
                    "
                  >
                    <Bot
                      size={25}
                      className="text-purple-500"
                    />
                  </div>

                  <p className="text-sm font-semibold text-gray-700 mt-4">
                    No AI intelligence report available
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Refresh the report to generate the latest university analysis.
                  </p>

                  <button
                    onClick={() =>
                      fetchAIRecommendation(
                        true,
                        true
                      )
                    }
                    className="
                      mt-4
                      px-4
                      py-2
                      rounded-lg
                      bg-[#4e094e]
                      text-white
                      text-sm
                      font-semibold
                      hover:bg-[#3d073d]
                      transition
                    "
                  >
                    Generate Report
                  </button>

                </div>
              )}

          </div>
        </div>
      )}
    </>
  );
};

export default AIFloatingButton;

